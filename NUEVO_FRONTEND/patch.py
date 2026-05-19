import os

text = open('frontend/src/components/ScheduleManager.jsx', encoding='utf-8').read()

text = text.replace(
    'const [jMatchPlayTime, setJMatchPlayTime] = useState(tournament.matchPlayTime || 10)',
    'const [jMatchPlayTime, setJMatchPlayTime] = useState(tournament.matchPlayTime || 10)\n  const [jRestRoundsBetweenMatches, setJRestRoundsBetweenMatches] = useState(1)'
)

text = text.replace(
    'const [jEditMatchPlayTime, setJEditMatchPlayTime] = useState(tournament.matchPlayTime || 10)',
    'const [jEditMatchPlayTime, setJEditMatchPlayTime] = useState(tournament.matchPlayTime || 10)\n  const [jEditRestRoundsBetweenMatches, setJEditRestRoundsBetweenMatches] = useState(1)'
)

text = text.replace(
    'matchPlayTime: parseInt(jMatchPlayTime)',
    'matchPlayTime: parseInt(jMatchPlayTime),\n        restRoundsBetweenMatches: Math.max(0, parseInt(jRestRoundsBetweenMatches) || 0)'
)

text = text.replace(
    'setJMatchPlayTime(tournament.matchPlayTime || 10)',
    'setJMatchPlayTime(tournament.matchPlayTime || 10)\n      setJRestRoundsBetweenMatches(1)'
)

text = text.replace(
    'setJEditMatchPlayTime(j.matchPlayTime || tournament.matchPlayTime || 10)',
    'setJEditMatchPlayTime(j.matchPlayTime || tournament.matchPlayTime || 10)\n    setJEditRestRoundsBetweenMatches(j.restRoundsBetweenMatches ?? 1)'
)

text = text.replace(
    'matchPlayTime: parseInt(jEditMatchPlayTime)',
    'matchPlayTime: parseInt(jEditMatchPlayTime),\n          restRoundsBetweenMatches: Math.max(0, parseInt(jEditRestRoundsBetweenMatches) || 0)'
)

text = text.replace(
    '<th>T. Partido</th>',
    '<th>T. Partido</th>\n                    <th>Descanso</th>'
)

text = text.replace(
    '<td><input type="number" className="form-input form-input-sm" value={jEditMatchPlayTime} onChange={e => setJEditMatchPlayTime(e.target.value)} min="1" /></td>',
    '<td><input type="number" className="form-input form-input-sm" value={jEditMatchPlayTime} onChange={e => setJEditMatchPlayTime(e.target.value)} min="1" /></td>\n                          <td><input type="number" className="form-input form-input-sm" value={jEditRestRoundsBetweenMatches} onChange={e => setJEditRestRoundsBetweenMatches(e.target.value)} min="0" /></td>'
)

text = text.replace(
    '<td>{j.matchPlayTime ?? tournament.matchPlayTime ?? 10} min</td>',
    '<td>{j.matchPlayTime ?? tournament.matchPlayTime ?? 10} min</td>\n                          <td>{j.restRoundsBetweenMatches ?? 1} ronda(s)</td>'
)

text = text.replace(
    '</button></div></div>\n            <button type="submit"',
    '</button></div></div>\n            <div className="form-group"><label className="form-label">Rondas descanso</label><input className="form-input" type="number" min="0" value={jRestRoundsBetweenMatches} onChange={e => setJRestRoundsBetweenMatches(e.target.value)} /></div>\n            <button type="submit"'
)

open('frontend/src/components/ScheduleManager.jsx', 'w', encoding='utf-8').write(text)
print('Done!')
