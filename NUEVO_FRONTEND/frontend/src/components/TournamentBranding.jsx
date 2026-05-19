import { getTournamentBackgroundLogo, getTournamentHeaderLogo } from '../utils/tournamentBranding'

export default function TournamentBranding({
  tournament,
  children,
  minHeight = '100vh',
  maxWidth = null,
  centered = false,
  padding = null,
  backgroundOpacity = 0.14,
  backgroundSize = 'min(72vw, 920px)',
  contentStyle = {},
}) {
  const backgroundLogo = getTournamentBackgroundLogo(tournament)

  return (
    <div
      style={{
        position: 'relative',
        minHeight,
        background: 'var(--bg)',
        color: 'var(--text)',
        overflow: 'hidden',
      }}
    >
      {backgroundLogo && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundImage: `url(${backgroundLogo})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center',
              backgroundSize,
              opacity: backgroundOpacity,
              pointerEvents: 'none',
              zIndex: 0,
              filter: 'grayscale(12%)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(10,14,26,0.82) 0%, rgba(10,14,26,0.9) 100%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight,
          width: '100%',
          maxWidth: maxWidth || 'none',
          margin: centered ? '0 auto' : undefined,
          padding: padding || undefined,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export { getTournamentHeaderLogo }
