import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Routes, Route, Link, useLocation } from 'react-router-dom'
import { getTournament, getCategories, getMatches, getSchedule, getStandings, getFinalRanking } from '../api'
import GlobalTimer from './GlobalTimer'
import TournamentBranding, { getTournamentHeaderLogo } from './TournamentBranding'
import { resolveImageUrl } from '../utils/tournamentBranding'

function BracketMatch({ match, large = false }) {
  const isWinner = (teamId) => {
    if (match.status !== 'played') return false
    if (teamId === match.homeTeamId) return Number(match.homeScore) > Number(match.awayScore)
    if (teamId === match.awayTeamId) return Number(match.awayScore) > Number(match.homeScore)
    return false
  }
  const color = match.category?.color || '#f97316'
  return (
    <div className="bracket-match" style={{ 
      background: 'rgba(255,255,255,0.03)', 
      border: match.status === 'played' ? `1px solid ${color}` : '1px solid var(--border)',
      borderRadius: '8px', padding: '0.75rem', width: large ? '240px' : '200px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)', marginBottom: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {match.active && (
        <div className="pulse-active" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: '#22c55e',
          zIndex: 2
        }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
          {match.group}
          {match.active && (
            <span style={{ 
              color: match.isLive ? '#ef4444' : '#22c55e', 
              fontSize: '0.6rem',
              background: match.isLive ? 'rgba(239,68,68,0.1)' : 'transparent',
              padding: '1px 4px',
              borderRadius: '4px',
              fontWeight: 900
            }}>{match.isLive ? 'EN JUEGO' : 'ACTIVO'}</span>
          )}
        </div>
        {match.active && (
          <span style={{ 
            color: match.isLive ? '#ef4444' : '#22c55e', 
            fontSize: '0.55rem',
            fontWeight: 900,
            padding: '1px 4px',
            background: match.isLive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            borderRadius: '4px',
            animation: match.isLive ? 'pulse-live 1s infinite' : 'none',
            whiteSpace: 'nowrap'
          }}>{match.isLive ? 'EN JUEGO' : 'ACTIVO'}</span>
        )}
      </div>

      <div style={{ 
        display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', 
        fontWeight: isWinner(match.homeTeamId) ? 800 : 500,
        color: isWinner(match.homeTeamId) ? color : 'inherit',
        background: isWinner(match.homeTeamId) ? `${color}20` : 'transparent',
        padding: isWinner(match.homeTeamId) ? '0.1rem 0.3rem' : '0',
        borderRadius: '3px',
        transition: 'all 0.3s'
      }}>
        <span 
          title={match.homeTeam?.name || 'TBD'}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%', cursor: 'help' }}
        >
          {match.homeTeam?.name || 'TBD'}
        </span>
        <span style={{ fontWeight: 900 }}>{match.homeScore ?? '-'}</span>
      </div>
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', 
        fontWeight: isWinner(match.awayTeamId) ? 800 : 500,
        color: isWinner(match.awayTeamId) ? color : 'inherit',
        background: isWinner(match.awayTeamId) ? `${color}20` : 'transparent',
        padding: isWinner(match.awayTeamId) ? '0.1rem 0.3rem' : '0',
        borderRadius: '3px',
        transition: 'all 0.3s'
      }}>
        <span 
          title={match.awayTeam?.name || 'TBD'}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%', cursor: 'help' }}
        >
          {match.awayTeam?.name || 'TBD'}
        </span>
        <span style={{ fontWeight: 900 }}>{match.awayScore ?? '-'}</span>
      </div>

      {match.isLive && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', gap: '0.5rem' }}>
          <div style={{ 
            fontSize: '0.6rem', fontWeight: 800, color: match.homeFouls >= 5 ? '#ef4444' : 'var(--text3)',
            padding: '1px 4px', background: match.homeFouls >= 5 ? 'rgba(239,68,68,0.1)' : 'transparent',
            borderRadius: '4px', border: match.homeFouls >= 5 ? '1px solid #ef4444' : 'none'
          }}>
            {match.homeFouls >= 5 && 'AVISO '}FALTAS: {match.homeFouls || 0}
          </div>
          <div style={{ 
            fontSize: '0.6rem', fontWeight: 800, color: match.awayFouls >= 5 ? '#ef4444' : 'var(--text3)',
            padding: '1px 4px', background: match.awayFouls >= 5 ? 'rgba(239,68,68,0.1)' : 'transparent',
            borderRadius: '4px', border: match.awayFouls >= 5 ? '1px solid #ef4444' : 'none'
          }}>
            FALTAS: {match.awayFouls || 0}{match.awayFouls >= 5 && ' AVISO'}
          </div>
        </div>
      )}
      {match.observations && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.6rem', color: 'var(--text3)' }}>
          <div style={{ fontStyle: 'italic' }}>Nota: {match.observations}</div>
        </div>
      )}
    </div>
  )
}

function MedalIcon({ rank }) {
  const palette = {
    1: { medal: '#facc15', edge: '#ca8a04', ribbonLeft: '#dc2626', ribbonRight: '#1d4ed8' },
    2: { medal: '#d1d5db', edge: '#6b7280', ribbonLeft: '#9333ea', ribbonRight: '#2563eb' },
    3: { medal: '#d97706', edge: '#92400e', ribbonLeft: '#16a34a', ribbonRight: '#0f766e' }
  }

  const colors = palette[rank]
  if (!colors) return <>{rank}</>

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M18 6h10l6 16H24L18 6Z" fill={colors.ribbonLeft} />
        <path d="M36 6h10l-6 16H30L36 6Z" fill={colors.ribbonRight} />
        <circle cx="32" cy="38" r="18" fill={colors.medal} stroke={colors.edge} strokeWidth="4" />
        <circle cx="32" cy="38" r="10" fill="rgba(255,255,255,0.22)" />
        <text x="32" y="43" textAnchor="middle" fontSize="18" fontWeight="900" fill={colors.edge}>
          {rank}
        </text>
      </svg>
    </span>
  )
}

function MenuIcon({ kind, active }) {
  const accent = active ? 'var(--accent)' : 'rgba(255,255,255,0.92)'
  const glow = active ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.08)'

  const frameStyle = {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    display: 'grid',
    placeItems: 'center',
    background: `linear-gradient(180deg, ${glow} 0%, rgba(255,255,255,0.02) 100%)`,
    border: `1px solid ${active ? 'rgba(249,115,22,0.45)' : 'rgba(255,255,255,0.12)'}`,
    boxShadow: active ? '0 10px 24px rgba(249,115,22,0.18)' : '0 8px 18px rgba(0,0,0,0.18)'
  }

  if (kind === 'info') {
    return (
      <span style={frameStyle}>
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={accent} strokeWidth="2.2" />
          <circle cx="12" cy="7.2" r="1.4" fill={accent} />
          <path d="M12 10.5v6" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
    )
  }

  if (kind === 'categories') {
    return (
      <span style={frameStyle}>
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" rx="1.6" fill="none" stroke={accent} strokeWidth="2" />
          <rect x="14" y="4" width="6" height="6" rx="1.6" fill={accent} />
          <rect x="4" y="14" width="6" height="6" rx="1.6" fill={accent} opacity="0.7" />
          <rect x="14" y="14" width="6" height="6" rx="1.6" fill="none" stroke={accent} strokeWidth="2" />
        </svg>
      </span>
    )
  }

  return (
    <span style={frameStyle}>
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5l2 14 5-4 5 4 2-14" fill="none" stroke={accent} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 6.5h10" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        <path d="M6 10.5h12" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        <path d="M8 14.5h8" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function PublicInfo({ tournament }) {
  const Section = ({ id, title, text }) => {
    if (!text || text === '<p><br></p>') return null
    return (
      <div id={id} className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent)', fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>{title}</h3>
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    )
  }

  const sections = [
    { id: 'cartel-evento', title: 'Cartel del Evento', key: 'eventPosterUrl', type: 'image' },
    { id: 'info-general', title: 'Informacion General', key: 'generalInfo', type: 'text' },
    { id: 'ubicacion', title: 'Ubicacion', key: 'locationInfo', type: 'text' },
    { id: 'contacto', title: 'Contacto', key: 'contactInfo', type: 'text' },
    { id: 'reglamento', title: 'Reglamento', key: 'rules', type: 'text' },
    { id: 'cartel-cafeteria', title: 'Cartel Cafeteria / Menu', key: 'cafePosterUrl', type: 'image' },
    { id: 'patrocinadores', title: 'Patrocinadores', key: 'sponsorsImageUrl', type: 'image' }
  ].filter(s => !!tournament[s.key] && tournament[s.key] !== '<p><br></p>')

  return (
    <div className="animate-in">
      {/* Menu de Navegacion Rapida */}
      {sections.length > 1 && (
        <div className="quick-nav">
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} className="quick-nav-item">
              {s.title.split(' ')[0]} {s.title.split(' ').slice(1).join(' ')}
            </a>
          ))}
        </div>
      )}

      {/* Renderizado de Secciones en Orden */}
      {sections.map(s => {
        if (s.type === 'image') {
          return (
            <div id={s.id} key={s.id} style={{ marginBottom: '1.5rem' }}>
              <img 
                src={resolveImageUrl(tournament[s.key])} 
                alt={s.title} 
                style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)', display: 'block', boxShadow: 'var(--shadow)' }} 
              />
            </div>
          )
        }
        return <Section key={s.id} id={s.id} title={s.title} text={tournament[s.key]} />
      })}
    </div>
  )
}

function PublicCategories({ categories, tournamentId, categoryIdsWithMatches, onRefresh, refreshInterval = 3000 }) {
  const filteredCategories = categories.filter(c => categoryIdsWithMatches.has(c.id))
  const [activeCat, setActiveCat] = useState(filteredCategories[0]?.id || null)
  const [matches, setMatches] = useState([])
  const [standings, setStandings] = useState({ global: [], byGroup: {} })
  const [finalRanking, setFinalRanking] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [allMatches, stds, fr] = await Promise.all([
        getMatches(tournamentId),
        activeCat ? getStandings(activeCat) : Promise.resolve({ global: [], byGroup: {} }),
        activeCat ? getFinalRanking(activeCat) : Promise.resolve([])
      ])
      
      // Actualizar categorias validas dinamicamente
      const newIds = new Set(allMatches.map(m => m.categoryId))
      // Solo actualizamos si hay cambios para evitar re-renders infinitos
      // (aunque al ser Set y compararlo necesitarianos logica extra, simplificamos por ahora)
      
      if (activeCat) {
        setMatches(allMatches.filter(m => m.categoryId === activeCat))
        setStandings(stds)
        setFinalRanking(fr)
      }
    } catch (e) { console.error(e) }
    finally { if (!silent) setLoading(false) }
  }, [activeCat, tournamentId])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), refreshInterval)
    return () => clearInterval(interval)
  }, [load, refreshInterval])

  if (!categories.length) return <div className="text-muted text-center" style={{ padding: '2rem' }}>No hay categorias.</div>

  const groups = Object.keys(standings.byGroup || {}).sort((a, b) =>
    String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' })
  )
  const octavosMatches = matches.filter(m => m.group?.includes('Octavos'))
  const cuartosMatches = matches.filter(m => m.group?.includes('Cuartos'))
  const semifinalMatches = matches.filter(m => m.group?.includes('Semifinal'))
  const finalMatches = matches.filter(m => m.group === 'Final')
  const thirdPlaceMatches = matches.filter(m => m.group === 'Tercer y Cuarto Puesto')

  const hasOctavos = octavosMatches.length > 0
  const hasCuartos = cuartosMatches.length > 0
  const hasSemis = semifinalMatches.length > 0
  const hasThirdPlace = thirdPlaceMatches.length > 0

  const baseMatchHeight = 132
  const bracketGap = 24
  const bracketTitleSpace = 42
  const bracketRows = Math.max(octavosMatches.length, cuartosMatches.length * 2, semifinalMatches.length * 4, 8)
  const bracketColumnHeight = Math.max(320, bracketRows * baseMatchHeight + Math.max(0, bracketRows - 1) * (bracketGap / 2) + bracketTitleSpace)

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button 
          onClick={() => { onRefresh(); load(); }} 
          className="btn btn-secondary btn-sm" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
        >
          Actualizar Resultados
        </button>
      </div>
      <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', paddingBottom: '1rem', marginBottom: '1rem' }}>
        {filteredCategories.map(c => (
          <button 
            key={c.id} 
            onClick={() => setActiveCat(c.id)}
            style={{ 
              background: activeCat === c.id ? c.color : 'transparent',
              border: `1px solid ${c.color}`,
              color: activeCat === c.id ? '#fff' : c.color,
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            {c.name} ({c.gender})
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" style={{ margin: '2rem auto' }} /> : (
        <div style={{ position: 'relative', minHeight: '400px' }}>
          {matches.length > 0 && matches.some(m => m.status !== 'played') && (
            <div className="provisional-watermark">PROVISIONAL</div>
          )}
          {groups.length > 0 ? (
            groups.map(g => (
              <div key={g} className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text1)' }}>Grupo {g}</h3>
                <div className="table-responsive">
                  <table className="table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Equipo</th>
                        <th title="Ganados">G</th>
                        <th title="Perdidos">P</th>
                        <th title="Puntos a favor">PF</th>
                        <th title="Puntos en contra">PC</th>
                        <th title="Diferencia">DIF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.byGroup[g].map((t, idx) => (
                        <tr key={t.id}>
                          <td>{idx + 1}</td>
                          <td title={t.name} style={{ fontWeight: 600, cursor: 'help' }}>{t.name}</td>
                          <td style={{ color: 'var(--green)' }}>{t.wins}</td>
                          <td style={{ color: 'var(--red)' }}>{t.losses}</td>
                          <td>{t.pf}</td>
                          <td>{t.pa}</td>
                          <td>{t.diff > 0 ? `+${t.diff}` : t.diff}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted text-center" style={{ padding: '2rem' }}>No hay grupos generados.</div>
          )}



          {/* Partidos fase eliminatoria (Cuadro de Honor) */}
          {matches.some(m => m.round >= 2) && (
              <div className="card" style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', overflowX: 'auto', marginTop: '2rem' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>Cuadros Eliminatorios</h3>
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-start', alignItems: 'center', minWidth: 'max-content', padding: '0 0.5rem 1rem' }}>
                  
                  {hasOctavos && (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem', minWidth: '220px', flex: '0 0 220px', minHeight: `${bracketColumnHeight}px` }}>
                      <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text2)', marginBottom: '1rem' }}>OCTAVOS</div>
                      {octavosMatches.map(m => <BracketMatch key={m.id} match={m} />)}
                    </div>
                  )}

                  {hasCuartos && (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: `${bracketColumnHeight}px` }}>
                      <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text2)', marginBottom: '1rem' }}>CUARTOS</div>
                      {cuartosMatches.map(m => <BracketMatch key={m.id} match={m} />)}
                    </div>
                  )}

                  {hasSemis && (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: `${bracketColumnHeight}px` }}>
                      <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text2)', marginBottom: '1rem' }}>SEMIFINALES</div>
                      {semifinalMatches.map(m => <BracketMatch key={m.id} match={m} />)}
                    </div>
                  )}

                    <div style={{ minWidth: '240px', flex: '0 0 240px', minHeight: `${bracketColumnHeight}px`, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)' }}>
                        <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>GRAN FINAL</div>
                        {finalMatches.length > 0 ? (
                          finalMatches.map(m => <BracketMatch key={m.id} match={m} large />)
                        ) : (
                          <div style={{ width: '240px', height: '100px', border: '2px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: '0.8rem' }}>
                            Esperando finalistas...
                          </div>
                        )}
                      </div>

                      {hasThirdPlace && (
                        <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(50% + 150px)' }}>
                          <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text2)', marginBottom: '1rem' }}>3o Y 4o PUESTO</div>
                          {thirdPlaceMatches.map(m => <BracketMatch key={m.id} match={m} />)}
                        </div>
                      )}
                    </div>

                </div>
              </div>
          )}

          {/* Ranking Final del Torneo */}
          {finalRanking.length > 0 && (
            <div className="card animate-in" style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(249,115,22,0.03)', borderRadius: '12px', border: '1px solid rgba(249,115,22,0.2)', overflowX: 'auto' }}>
              <h3 style={{ color: 'var(--accent)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.5rem' }}>
                CLASIFICACION GENERAL
              </h3>
              <div className="table-wrap" style={{ background: 'transparent' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px', width: '100%', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th style={{ background: 'transparent', textAlign: 'center' }}>PUESTO</th>
                      <th style={{ background: 'transparent' }}>EQUIPO</th>
                      <th style={{ background: 'transparent' }}>LOGRO / PREMIO</th>
                      <th style={{ background: 'transparent' }}>BALANCE GENERAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalRanking.map((r, i) => {
                      const isPodium = r.rank <= 3;
                      return (
                        <tr key={r.teamId} style={{ 
                          background: isPodium ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                          boxShadow: isPodium ? '0 4px 12px rgba(249,115,22,0.1)' : 'none',
                          transform: isPodium ? 'scale(1.01)' : 'none'
                        }}>
                          <td style={{ 
                            padding: '1rem', 
                            fontSize: isPodium ? '1.4rem' : '1.1rem', 
                            textAlign: 'center', 
                            fontWeight: 800,
                            color: r.rank === 1 ? '#ffd700' : r.rank === 2 ? '#c0c0c0' : r.rank === 3 ? '#cd7f32' : 'var(--text2)'
                          }}>
                            {r.rank <= 3 ? <MedalIcon rank={r.rank} /> : r.rank}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 700, fontSize: isPodium ? '1.1rem' : '0.95rem' }}>
                            {r.team.name}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span className={`badge ${r.rank === 1 ? 'badge-success' : r.rank === 2 ? 'badge-blue' : 'badge-pending'}`} style={{ padding: '0.4rem 0.8rem' }}>
                              {r.note}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text2)' }}>
                             {r.wins}G | {r.diff >= 0 ? '+' : ''}{r.diff} Dif | {r.pf} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function PublicSchedule({ tournamentId, categories, refreshInterval = 3000 }) {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filterTime, setFilterTime] = useState('')
  const [filterCourt, setFilterCourt] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await getSchedule(tournamentId)
      setSlots(data)
    } catch (e) { console.error(e) }
    finally { if (!silent) setLoading(false) }
  }, [tournamentId])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), refreshInterval)
    return () => clearInterval(interval)
  }, [load, refreshInterval])

  if (loading) return <div className="spinner" style={{ margin: '2rem auto' }} />
  if (!slots.length) return <div className="text-muted text-center" style={{ padding: '2rem' }}>No hay calendario publico aun.</div>

  const catColor = (cid) => categories.find(c => c.id === cid)?.color || '#555'
  const catInfo = (cid) => {
    const c = categories.find(cat => cat.id === cid);
    if (!c) return '';
    return `${c.name} (${c.gender}${c.isVeteran ? ' - VET' : ''})`;
  };

  // Opciones de filtros
  const uniqueDates = Array.from(new Set(slots.map(s => s.date).filter(Boolean))).sort()
  const uniqueTimes = Array.from(new Set(slots.map(s => s.startTime))).sort()
  const uniqueCourts = Array.from(new Set(slots.map(s => s.court))).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}))
  const uniqueCategories = Array.from(new Set(slots.map(s => s.match?.categoryId).filter(Boolean)))
  const uniqueTeams = Array.from(new Set(slots.flatMap(s => [s.match?.homeTeam?.name, s.match?.awayTeam?.name]).filter(Boolean))).sort()

  const filteredSlots = slots.filter(slot => {
    if (filterDate && slot.date !== filterDate) return false
    if (filterTime && slot.startTime !== filterTime) return false
    if (filterCourt && slot.court !== filterCourt) return false
    if (filterCategory && slot.match?.categoryId !== parseInt(filterCategory)) return false
    if (filterTeam && slot.match?.homeTeam?.name !== filterTeam && slot.match?.awayTeam?.name !== filterTeam) return false
    return true
  })
  
  // Group by date and time
  const grouped = filteredSlots.reduce((acc, slot) => {
    const key = `${slot.date || 'Sin fecha'}|${slot.startTime}`
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  // Order slots within time by court
  Object.keys(grouped).forEach(k => {
    grouped[k].sort((a, b) => a.court.localeCompare(b.court, undefined, { numeric: true }))
  })

  const timeKeys = Object.keys(grouped).sort()

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button 
          onClick={() => load()} 
          className="btn btn-secondary btn-sm" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
        >
          Actualizar Resultados
        </button>
      </div>
      <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
        <div className="card-title" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Filtros de Calendario</div>
        <div className="form-row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
          {uniqueDates.length > 1 && (
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Dia</label>
              <select className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
                <option value="">Todos los dias</option>
                {uniqueDates.map(d => (
                  <option key={d} value={d}>
                    {d.includes('-') ? d.split('-').reverse().join('-') : d}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group" style={{ flex: 1, minWidth: '100px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Hora</label>
            <select className="form-input" value={filterTime} onChange={e => setFilterTime(e.target.value)}>
              <option value="">Todas</option>
              {uniqueTimes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Pista</label>
            <select className="form-input" value={filterCourt} onChange={e => setFilterCourt(e.target.value)}>
              <option value="">Todas</option>
              {uniqueCourts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Categoria</label>
            <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">Todas</option>
              {uniqueCategories
                .filter(cid => categories.find(c => c.id === cid)?.teams?.length > 0)
                .map(cid => <option key={cid} value={cid}>{catInfo(cid)}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1.5 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Equipo</label>
            <select className="form-input" value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
              <option value="">Todos</option>
              {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {timeKeys.length === 0 && (
        <div className="text-muted text-center" style={{ padding: '2rem' }}>No hay partidos para estos filtros.</div>
      )}

      {timeKeys.map(timeKey => {
        const [date, time] = timeKey.split('|')
        return (
          <div key={timeKey} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text1)' }}>{time}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{date.includes('-') ? date.split('-').reverse().join('-') : date}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {grouped[timeKey].map(slot => {
                const m = slot.match
                if (!m) return null
                const color = catColor(m.categoryId)
                const hS = m.homeScore;
                const aS = m.awayScore;
                const homeWon = m.status === 'played' && hS !== null && aS !== null && Number(hS) > Number(aS)
                const awayWon = m.status === 'played' && hS !== null && aS !== null && Number(aS) > Number(hS)
                const catObj = m.category || categories.find(c => Number(c.id) === Number(m.categoryId))
                const cCol = catObj?.color || color || '#f97316'

                return (
                  <div key={slot.id} className="card" style={{ padding: '0.75rem', borderLeft: `4px solid ${cCol}`, display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', gap: '0.5rem', flexWrap: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                         <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{slot.court.toUpperCase()}</span>
                         {m.active && (
                           <span style={{
                             color: m.isLive ? '#ef4444' : '#22c55e',
                             fontSize: '0.6rem',
                             fontWeight: 900,
                             letterSpacing: '0.5px',
                             padding: '1px 4px',
                             background: m.isLive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                             borderRadius: '4px',
                             animation: m.isLive ? 'pulse-live 1s infinite' : 'pulse 2s infinite',
                             whiteSpace: 'nowrap'
                           }}>
                             {m.isLive ? 'EN JUEGO' : 'ACTIVO'}
                           </span>
                         )}
                       </div>
                       <span style={{ 
                         fontWeight: 600, 
                         color: cCol, 
                         textAlign: 'right', 
                         fontSize: '0.65rem',
                         overflow: 'hidden',
                         textOverflow: 'ellipsis',
                         whiteSpace: 'nowrap',
                         flex: 1,
                         minWidth: 0
                       }}>
                         {catInfo(m.categoryId)} {m.group ? `(Gr. ${m.group})` : ''}
                       </span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px' }}>
                          <div style={{ 
                            flex: 1, 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '0.2rem'
                          }}>
                            <div style={{ 
                              width: '100%',
                              fontWeight: homeWon ? 900 : 500, 
                              color: homeWon ? cCol : 'inherit', 
                              background: homeWon ? `${cCol}40` : 'transparent',
                              textAlign: 'right',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              border: homeWon ? `2px solid ${cCol}` : '1px solid transparent',
                              fontSize: '0.82rem',
                              lineHeight: 1.15,
                              minHeight: '2.25rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word'
                            }}>
                              {m.homeTeam?.name || 'TBD'}
                            </div>
                            {m.isLive && (
                              <div style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: 800, 
                                color: m.homeFouls >= 5 ? '#ef4444' : 'var(--text3)',
                                padding: '1px 4px',
                                background: m.homeFouls >= 5 ? 'rgba(239,68,68,0.1)' : 'transparent',
                                borderRadius: '4px',
                                border: m.homeFouls >= 5 ? '1px solid #ef4444' : 'none'
                              }}>
                                {m.homeFouls >= 5 && 'AVISO '}FALTAS: {m.homeFouls || 0}
                              </div>
                            )}
                          </div>

                          <div style={{ padding: '0 0.8rem', fontWeight: 800, fontSize: '1.1rem', color: (hS !== null || aS !== null) ? 'var(--text1)' : 'var(--text3)', textAlign: 'center' }}>
                            {(hS !== null || aS !== null) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div>
                                  <span style={{ color: homeWon ? cCol : 'inherit', fontSize: homeWon ? '1.4rem' : '1.1rem', fontWeight: homeWon ? 900 : 800 }}>{m.homeScore}</span>
                                  <span style={{ opacity: 0.3 }}> - </span>
                                  <span style={{ color: awayWon ? cCol : 'inherit', fontSize: awayWon ? '1.4rem' : '1.1rem', fontWeight: awayWon ? 900 : 800 }}>{m.awayScore}</span>
                                </div>
                              </div>
                            ) : 'vs'}
                          </div>

                          <div style={{ 
                            flex: 1, 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '0.2rem'
                          }}>
                            <div style={{ 
                              width: '100%',
                              fontWeight: awayWon ? 900 : 500, 
                              color: awayWon ? cCol : 'inherit', 
                              background: awayWon ? `${cCol}40` : 'transparent',
                              textAlign: 'left',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              border: awayWon ? `2px solid ${cCol}` : '1px solid transparent',
                              fontSize: '0.82rem',
                              lineHeight: 1.15,
                              minHeight: '2.25rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word'
                            }}>
                              {m.awayTeam?.name || 'TBD'}
                            </div>
                            {m.isLive && (
                              <div style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: 800, 
                                color: m.awayFouls >= 5 ? '#ef4444' : 'var(--text3)',
                                padding: '1px 4px',
                                background: m.awayFouls >= 5 ? 'rgba(239,68,68,0.1)' : 'transparent',
                                borderRadius: '4px',
                                border: m.awayFouls >= 5 ? '1px solid #ef4444' : 'none'
                              }}>
                                FALTAS: {m.awayFouls || 0}{m.awayFouls >= 5 && ' AVISO'}
                              </div>
                            )}
                          </div>
                      </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                       {m.observations ? (
                         <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                           Nota: {m.observations}
                         </div>
                       ) : <div />}
                     </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PublicPortal() {
  const { tournamentId } = useParams()
  const location = useLocation()
  
  const [tournament, setTournament] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [matches, setMatches] = useState([]) // Guardamos partidos en el padre para reactividad global
  const tournamentRef = useRef(null)
  
  const categoryIdsWithMatches = new Set(matches.map(m => m.categoryId))
  
  const refreshData = useCallback(async () => {
    try {
      const [t, c, m] = await Promise.all([
        getTournament(tournamentId),
        getCategories(tournamentId),
        getMatches(tournamentId)
      ])
      setTournament(t)
      tournamentRef.current = t
      setCategories(c)
      setMatches(m)
    } catch (e) {
      setError("No se pudo cargar el evento (puede que no exista).")
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    refreshData()
    const refreshTime = tournamentRef.current?.monitorRefreshTime || 3
    const interval = setInterval(() => refreshData(), refreshTime * 1000)
    return () => clearInterval(interval)
  }, [refreshData])
  
  if (loading && !tournament) return <div className="spinner" style={{ margin: '3rem auto' }} />
  if (error) return <div className="alert alert-error" style={{ margin: '2rem' }}>Error: {error}</div>
  if (!tournament) return null

  const path = location.pathname
  
  const NavLink = ({ to, label, icon }) => {
    // Exact match for base, or includes for subpaths
    const active = to === '' ? path.endsWith(`/public/${tournamentId}`) : path.includes(to)
    const absoluteTo = `/public/${tournamentId}${to ? `/${to}` : ''}`
    return (
      <Link to={absoluteTo} style={{
        flex: 1, textAlign: 'center', padding: '1rem 0',
        textDecoration: 'none',
        color: active ? 'var(--accent)' : 'var(--text3)',
        borderBottom: active ? '3px solid var(--accent)' : '3px solid transparent',
        fontWeight: active ? '800' : '600',
        transition: '0.2s',
        display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center'
      }}>
        <MenuIcon kind={icon} active={active} />
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </Link>
    )
  }

  return (
    <TournamentBranding tournament={tournament} minHeight="100vh" centered>
    <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg)', minHeight: '100vh', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
      {/* Header Publico */}
      <header style={{ padding: '1.5rem 1rem', background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg2) 100%)', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
        <img src={getTournamentHeaderLogo(tournament)} alt="Logo" style={{ height: '60px', dropShadow: '0 0 10px rgba(249,115,22,0.3)' }} />
        <div>
          <div style={{ fontWeight: 900, color: 'var(--accent)', fontSize: '1.4rem', textTransform: 'uppercase', lineHeight: 1.2 }}>{tournament.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: '0.25rem' }}>
            <span style={{ marginRight: '0.5rem' }}>Lugar: {tournament.venue || 'Ubicacion por confirmar'}</span>
            {tournament.date && <span>Fecha: {tournament.date.includes('-') ? tournament.date.split('-').reverse().join('-') : tournament.date}</span>}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <GlobalTimer tournamentId={tournamentId} />
        </div>
      </header>
      
      {/* Navegacion Publica */}
      <nav style={{ display: 'flex', background: 'rgba(25,25,25,0.95)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border)' }}>
        <NavLink to="" label="Info" icon="info" />
        <NavLink to="categorias" label="Categorias" icon="categories" />
        <NavLink to="calendario" label="Partidos" icon="matches" />
      </nav>

      {/* Contenido Publico */}
      <main style={{ padding: '1.5rem 1rem' }}>
        <Routes>
          <Route path="" element={<PublicInfo tournament={tournament} />} />
          <Route path="categorias" element={<PublicCategories categories={categories} tournamentId={tournamentId} categoryIdsWithMatches={categoryIdsWithMatches} onRefresh={refreshData} />} />
          <Route path="calendario" element={<PublicSchedule tournamentId={tournamentId} categories={categories} />} />
        </Routes>
      </main>
      <footer className="footer">
        GESTOR TORNEOS BASKET 3x3 @ JON AMAYUELAS CELAYA 2026
      </footer>
    </div>
    </TournamentBranding>
  )
}
