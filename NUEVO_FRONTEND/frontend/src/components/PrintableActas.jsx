export default function PrintableActas({ matches }) {
  if (!matches || matches.length === 0) return null;

  // Filtrar solo los partidos que tienen número de partido asignado (y por ende hora)
  const scheduledMatches = matches.filter(m => m.matchNumber != null);

  // Agrupar en páginas de 2 partidos
  const pages = [];
  for (let i = 0; i < scheduledMatches.length; i += 2) {
    pages.push(scheduledMatches.slice(i, i + 2));
  }

  const getPhaseAbbr = (group) => {
    if (!group) return '';
    const g = group.toLowerCase();
    if (g.includes('octavo')) return 'OF';
    if (g.includes('cuarto')) return 'CF';
    if (g.includes('semifinal') || g.includes('semis')) return 'SF';
    if (g.includes('final')) return 'F';
    return '';
  };

  const getTeamName = (team, round, group, isHome) => {
    if (team?.name) return team.name;
    if (round === 1) return 'Pendiente';
    return isHome ? `Ganador ${group} (L)` : `Ganador ${group} (V)`;
  };

  const scoresTopRow = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const scoresBottomRow = [12, 13, 14, 15, 16, 17, 18, 19, 20];

  const Tanteo = ({ label }) => (
    <div className="tanteo-section">
      <div className="tanteo-header">
        <div className="tanteo-title">{label}</div>
        <div className="bonus-box">
          <span className="bonus-label">BONUS</span>
          <div className="bonus-grid">
            {[1, 2, 3, 4, 5].map((b, i) => (
              <div key={b} className={`bonus-cell ${b === 5 ? 'text-red bg-gray' : ''}`}>
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="score-grid">
        {scoresTopRow.map((s, i) => (
          <div key={`t-${i}`} className="score-cell">
            {s}
          </div>
        ))}
        {scoresBottomRow.map((s, i) => (
          <div key={`b-${i}`} className="score-cell">
            {s}
          </div>
        ))}
        <div className="score-cell bg-gray" style={{ gridColumn: 'span 2' }}>
          21
        </div>
      </div>
    </div>
  );

  return (
    <div className="print-container">
      {pages.map((pageMatches, pageIndex) => (
        <div className="acta-page" key={pageIndex}>
          {pageMatches.map((match) => {
            const phaseAbbr = getPhaseAbbr(match.group);
            const isElimination = (match.round && match.round > 1) || !!phaseAbbr;
            const bgClass = isElimination ? 'elimination' : '';
            
            // Usar color de dinámica o general
            const cat = match.category;
            const catColor = cat?.color || '#fb923c';

            return (
              <div className="acta-half" key={match.id}>
                <div className="acta-box" style={{ '--cat-color': catColor }}>
                  <div className={`acta-match-num ${bgClass}`}>
                    {match.matchNumber}
                  </div>
                  {phaseAbbr && (
                    <div className="acta-phase-label">{phaseAbbr}</div>
                  )}

                  <div className="acta-court-label">
                    {match.scheduleSlot?.court || match.court || '—'}
                  </div>

                  <div className="acta-header-grid">
                    {/* Row 1 */}
                    <span className="acta-label">EQUIPO L:</span>
                    <div className="acta-value">{getTeamName(match.homeTeam, match.round, match.group, true)}</div>
                    <span className="acta-label acta-right-label">CATEGORIA:</span>
                    <div className="acta-bg-value">
                      <div style={{ lineHeight: '1.2' }}>{cat?.name}</div>
                      {cat?.gender && (
                        <div style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{cat.gender}</div>
                      )}
                    </div>

                    {/* Row 2 */}
                    <span className="acta-label">EQUIPO V:</span>
                    <div className="acta-value">{getTeamName(match.awayTeam, match.round, match.group, false)}</div>
                    <span className="acta-label acta-right-label">HORA:</span>
                    <div className="acta-bg-value" style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '0.05em' }}>
                      {match.scheduleSlot?.startTime || '--:--'}
                    </div>
                  </div>

                  <Tanteo label="TANTEO LOCAL" />
                  <Tanteo label="TANTEO VISITANTE" />
                  
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
