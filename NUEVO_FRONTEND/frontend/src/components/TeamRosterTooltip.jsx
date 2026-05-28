import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const TOOLTIP_DELAY_MS = 2000
const TOOLTIP_WIDTH = 320
const VIEWPORT_MARGIN = 12
const TOOLTIP_GAP = 12

function formatPlayerName(player) {
  const lastName = String(player?.lastName || '').trim()
  const firstName = String(player?.name || '').trim()
  if (lastName && firstName) return `${lastName}, ${firstName}`
  return lastName || firstName || 'Jugador sin nombre'
}

function formatContactName(team) {
  const contactName = String(team?.contactName || '').trim()
  const contactLastName = String(team?.contactLastName || '').trim()
  if (contactLastName && contactName) return `${contactLastName}, ${contactName}`
  return contactLastName || contactName || 'Sin contacto asignado'
}

function getTooltipPosition(rect) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, viewportWidth - (VIEWPORT_MARGIN * 2))
  const preferredLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2)
  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, preferredLeft),
    viewportWidth - tooltipWidth - VIEWPORT_MARGIN
  )

  const estimatedHeight = 220
  const fitsBelow = rect.bottom + TOOLTIP_GAP + estimatedHeight <= viewportHeight - VIEWPORT_MARGIN
  const top = fitsBelow
    ? rect.bottom + TOOLTIP_GAP
    : Math.max(VIEWPORT_MARGIN, rect.top - estimatedHeight - TOOLTIP_GAP)

  return {
    left,
    top,
    width: tooltipWidth,
    placement: fitsBelow ? 'bottom' : 'top'
  }
}

export default function TeamRosterTooltip({ team, align = 'center' }) {
  const triggerRef = useRef(null)
  const timeoutRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState(null)
  const players = useMemo(() => Array.isArray(team?.players) ? team.players : [], [team?.players])

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition(getTooltipPosition(rect))
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      updatePosition()
      setVisible(true)
    }, TOOLTIP_DELAY_MS)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  useEffect(() => {
    if (!visible) return undefined
    const handleViewportChange = () => updatePosition()
    window.addEventListener('scroll', handleViewportChange, true)
    window.addEventListener('resize', handleViewportChange)
    return () => {
      window.removeEventListener('scroll', handleViewportChange, true)
      window.removeEventListener('resize', handleViewportChange)
    }
  }, [visible])

  const textAlign = align === 'right' ? 'right' : align === 'left' ? 'left' : 'center'

  return (
    <>
      <div
        ref={triggerRef}
        className="team-roster-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', textAlign }}
      >
        <div style={{ fontWeight: 'inherit', width: '100%' }}>{team?.name || 'TBD'}</div>
      </div>

      {visible && position && createPortal(
        <div
          className={`team-roster-popup team-roster-popup-${position.placement}`}
          style={{
            left: `${position.left}px`,
            top: `${position.top}px`,
            width: `${position.width}px`
          }}
        >
          <div className="team-roster-popup-header">
            <span>{team?.name || 'Equipo'}</span>
            <span className="badge badge-blue">{players.length} jug.</span>
          </div>
        <div className="team-roster-popup-body">
          {players.length > 0 ? players.map(player => (
            <div key={player.id || `${player.lastName}-${player.name}`} className="team-roster-player">
              {formatPlayerName(player)}
            </div>
          )) : (
            <div className="text-muted">Sin jugadores cargados</div>
          )}
        </div>
        <div className="team-roster-contact">
          <div className="team-roster-contact-title">Contacto del equipo</div>
          <div className="team-roster-contact-row">
            <span className="team-roster-contact-label">Nombre</span>
            <span className="team-roster-contact-value">{formatContactName(team)}</span>
          </div>
          <div className="team-roster-contact-row">
            <span className="team-roster-contact-label">Móvil</span>
            <span className="team-roster-contact-value">{team?.contactPhone || '—'}</span>
          </div>
          <div className="team-roster-contact-row">
            <span className="team-roster-contact-label">Email</span>
            <span className="team-roster-contact-value">{team?.contactEmail || '—'}</span>
          </div>
        </div>
      </div>,
        document.body
      )}
    </>
  )
}
