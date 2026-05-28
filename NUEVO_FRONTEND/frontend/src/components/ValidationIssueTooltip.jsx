import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function getTooltipPosition(rect) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const width = Math.min(280, viewportWidth - 24)
  const left = Math.min(
    Math.max(12, rect.left + (rect.width / 2) - (width / 2)),
    viewportWidth - width - 12
  )
  const showBelow = rect.bottom + 64 <= viewportHeight - 12
  const top = showBelow ? rect.bottom + 10 : Math.max(12, rect.top - 52)
  return { left, top, width }
}

export default function ValidationIssueTooltip({ message, children }) {
  const triggerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState(null)

  useEffect(() => {
    if (!visible) return undefined
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition(getTooltipPosition(rect))
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [visible])

  if (!message) return children

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{ display: 'inline-block' }}
      >
        {children}
      </span>
      {visible && position && createPortal(
        <div
          style={{
            position: 'fixed',
            left: `${position.left}px`,
            top: `${position.top}px`,
            width: `${position.width}px`,
            zIndex: 3000,
            background: 'rgba(127,29,29,0.97)',
            color: '#fee2e2',
            border: '1px solid rgba(248,113,113,0.45)',
            borderRadius: '10px',
            boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            padding: '0.75rem 0.9rem',
            fontSize: '0.82rem',
            lineHeight: 1.4
          }}
        >
          {message}
        </div>,
        document.body
      )}
    </>
  )
}
