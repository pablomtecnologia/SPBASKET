import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx'
import { getGroupLogics, createGroupLogic, updateGroupLogic, deleteGroupLogic } from '../api'

const GROUP_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const POSITION_COUNT = 16

const emptyDefinition = () => ({
  teamCount: '',
  roundTripCount: 1,
  groups: Object.fromEntries(GROUP_KEYS.map(key => [key, ''])),
  qualifiers: { 1: '', 2: '', 3: '', 4: '', 5: '' },
  finals: { octavos: false, cuartos: false, semifinal: false, final: false, playThirdFourth: false },
  positions: Array.from({ length: POSITION_COUNT }, () => '')
})

const defaultConfigObject = {
  definitions: [
    {
      teamCount: 3,
      roundTripCount: 2,
      groups: { A: 3, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      finals: { octavos: false, cuartos: false, semifinal: false, final: true, playThirdFourth: false },
      positions: ['A1', 'A2', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 4,
      roundTripCount: 1,
      groups: { A: 4, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      finals: { octavos: false, cuartos: false, semifinal: true, final: false, playThirdFourth: false },
      positions: ['A1', 'A4', 'A3', 'A2', '', '', '', '', '', '', '', '', '', '', '', '']
    }
  ]
}

const parseConfig = (configString) => {
  try {
    const parsed = JSON.parse(configString || '{}')
    const defs = Array.isArray(parsed.definitions) ? parsed.definitions : []
    return defs.map(def => ({
      teamCount: def.teamCount ?? '',
      roundTripCount: def.roundTripCount ?? 1,
      groups: Object.fromEntries(GROUP_KEYS.map(key => [key, def.groups?.[key] ?? ''])),
      qualifiers: {
        1: def.qualifiers?.[1] ?? def.qualifiers?.['1'] ?? '',
        2: def.qualifiers?.[2] ?? def.qualifiers?.['2'] ?? '',
        3: def.qualifiers?.[3] ?? def.qualifiers?.['3'] ?? '',
        4: def.qualifiers?.[4] ?? def.qualifiers?.['4'] ?? '',
        5: def.qualifiers?.[5] ?? def.qualifiers?.['5'] ?? '',
      },
      finals: {
        octavos: !!def.finals?.octavos,
        cuartos: !!def.finals?.cuartos,
        semifinal: !!def.finals?.semifinal,
        final: !!def.finals?.final,
        playThirdFourth: !!def.finals?.playThirdFourth,
      },
      positions: Array.from({ length: POSITION_COUNT }, (_, idx) => def.positions?.[idx] ?? '')
    }))
  } catch {
    return defaultConfigObject.definitions.map(def => ({
      ...def,
      groups: { ...def.groups },
      finals: { ...def.finals },
      positions: [...def.positions]
    }))
  }
}

const serializeConfig = (definitions) => JSON.stringify({
  definitions: definitions.map(def => ({
    teamCount: parseInt(def.teamCount),
    roundTripCount: parseInt(def.roundTripCount) || 1,
    groups: Object.fromEntries(GROUP_KEYS.map(key => [key, parseInt(def.groups[key] || 0) || 0])),
    qualifiers: {
      1: def.qualifiers?.[1] || '',
      2: def.qualifiers?.[2] || '',
      3: def.qualifiers?.[3] || '',
      4: def.qualifiers?.[4] || '',
      5: def.qualifiers?.[5] || '',
    },
    finals: {
      octavos: !!def.finals.octavos,
      cuartos: !!def.finals.cuartos,
      semifinal: !!def.finals.semifinal,
      final: !!def.finals.final,
      playThirdFourth: !!def.finals.playThirdFourth,
    },
    positions: Array.from({ length: POSITION_COUNT }, (_, idx) => def.positions[idx] || '')
  }))
}, null, 2)

const getEnabledPositionCount = (finals) => {
  if (finals?.octavos) return 16
  if (finals?.cuartos) return 8
  if (finals?.semifinal) return 4
  if (finals?.final) return 2
  return 0
}

const getFinalPhaseLabel = (finals) => {
  if (finals?.octavos) return 'Octavos de final'
  if (finals?.cuartos) return 'Cuartos de final'
  if (finals?.semifinal) return finals?.playThirdFourth ? 'Semifinales (+ 3º y 4º)' : 'Semifinales'
  if (finals?.final) return 'Final'
  return 'Sin eliminatorias'
}

const getUsedGroups = (groups) => (
  GROUP_KEYS
    .map(key => ({ key, value: parseInt(groups?.[key] || 0) || 0 }))
    .filter(group => group.value > 0)
)

const getQualifierRows = (qualifiers) => (
  [1, 2, 3, 4, 5]
    .map(pos => {
      const raw = qualifiers?.[pos] || qualifiers?.[String(pos)] || ''
      if (!raw) return null
      return {
        position: pos,
        value: raw,
        text: raw === 'T' ? `${pos}.º: pasan todos` : `${pos}.º: pasan los mejores ${raw}`
      }
    })
    .filter(Boolean)
)

const getUsedPositions = (positions, finals) => (
  Array.from({ length: getEnabledPositionCount(finals) }, (_, idx) => {
    const value = positions?.[idx] || ''
    return value ? { slot: idx + 1, value } : null
  }).filter(Boolean)
)

const buildGroupsText = (groups) => {
  const usedGroups = getUsedGroups(groups)
  return usedGroups.length
    ? usedGroups.map(group => `Grupo ${group.key}: ${group.value}`).join(' | ')
    : 'Sin grupos definidos'
}

const buildQualifiersText = (qualifiers) => {
  const rows = getQualifierRows(qualifiers)
  return rows.length ? rows.map(row => row.text).join(' | ') : 'No definido'
}

const buildPositionsText = (positions, finals) => {
  const rows = getUsedPositions(positions, finals)
  return rows.length ? rows.map(row => `${row.slot}: ${row.value}`).join(' | ') : 'Sin posiciones configuradas'
}

const TOURNAMENT_RULES = {
  bye: 'Si en algún cruce eliminatorio hay un BYE, el equipo emparejado contra ese BYE pasa directamente a la siguiente fase.',
  quarterfinals: 'En cuartos de final se respetará el orden del cuadro: CF1 enfrentará a los ganadores de OF1 y OF2, CF2 a los ganadores de OF3 y OF4, CF3 a los ganadores de OF5 y OF6 y CF4 a los ganadores de OF7 y OF8.',
  semifinals: 'Del mismo modo, SF1 la jugarán los ganadores de CF1 y CF2, mientras que SF2 la jugarán los ganadores de CF3 y CF4.',
  final: 'La final la disputarán los ganadores de SF1 y SF2.'
}

const getLogicDocumentData = (logic) => ({
  ...logic,
  definitions: parseConfig(logic.config).sort((a, b) => (parseInt(a.teamCount) || 0) - (parseInt(b.teamCount) || 0))
})

const slugify = (value) => String(value || 'bases')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const docxParagraph = (text, options = {}) => new Paragraph({
  spacing: options.spacing,
  alignment: options.alignment,
  heading: options.heading,
  thematicBreak: options.thematicBreak,
  children: [
    new TextRun({
      text,
      bold: !!options.bold,
      color: options.color,
      size: options.size
    })
  ]
})

const createDocxTable = (rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows,
  borders: {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }
  }
})

const createCell = (text, options = {}) => new TableCell({
  width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
  shading: options.shading ? { fill: options.shading } : undefined,
  children: [
    new Paragraph({
      alignment: options.alignment || AlignmentType.LEFT,
      spacing: { before: 80, after: 80, line: 276 },
      children: [
        new TextRun({
          text,
          bold: !!options.bold,
          color: options.color,
          size: options.size || 22
        })
      ]
    })
  ]
})

const buildLogicDocx = async (logic) => {
  const logicData = getLogicDocumentData(logic)
  const children = [
    docxParagraph(`Bases de competición: ${logicData.name}`, {
      heading: HeadingLevel.TITLE,
      color: '9A3412',
      spacing: { after: 240 }
    }),
    docxParagraph(logicData.description || 'Documento generado desde el mantenimiento de lógica de grupos.', {
      color: '4B5563',
      spacing: { after: 280 }
    }),
    docxParagraph('Este documento resume cómo se gestionan las reglas del torneo en función del número de jugadores inscritos en cada categoría.', {
      spacing: { after: 160, line: 300 }
    }),
    docxParagraph('Leyenda de clasificación: T significa que pasan todos los equipos de esa posición. Si aparece un número, pasan los mejores N equipos de esa posición.', {
      spacing: { after: 120, line: 300 }
    }),
    docxParagraph('Leyenda de cruces: una referencia como 1-3 significa el mejor tercer clasificado disponible, excluyendo a los terceros de grupo que ya estén asignados de forma fija en otras posiciones del cuadro.', {
      spacing: { after: 280, line: 300 }
    }),
    docxParagraph('Reglas de progresión del cuadro eliminatorio', {
      heading: HeadingLevel.HEADING_1,
      color: '111827',
      spacing: { before: 80, after: 140 }
    }),
    docxParagraph(TOURNAMENT_RULES.bye, {
      spacing: { after: 120, line: 300 }
    }),
    docxParagraph(TOURNAMENT_RULES.quarterfinals, {
      spacing: { after: 120, line: 300 }
    }),
    docxParagraph(TOURNAMENT_RULES.semifinals, {
      spacing: { after: 120, line: 300 }
    }),
    docxParagraph(TOURNAMENT_RULES.final, {
      spacing: { after: 280, line: 300 }
    })
  ]

  logicData.definitions.forEach((def, index) => {
    const groupRows = getUsedGroups(def.groups)
    const qualifierRows = getQualifierRows(def.qualifiers)
    const positionRows = getUsedPositions(def.positions, def.finals)

    children.push(
      docxParagraph(`Definición ${index + 1}: ${def.teamCount} jugadores`, {
        heading: HeadingLevel.HEADING_1,
        color: '111827',
        spacing: { before: index === 0 ? 0 : 280, after: 160 }
      }),
      createDocxTable([
        new TableRow({
          children: [
            createCell('Fase final', { bold: true, shading: 'FFF7ED', width: 32 }),
            createCell(getFinalPhaseLabel(def.finals), { width: 68 })
          ]
        }),
        new TableRow({
          children: [
            createCell('Número de vueltas', { bold: true, shading: 'FFF7ED', width: 32 }),
            createCell(String(def.roundTripCount || 1), { width: 68 })
          ]
        }),
        new TableRow({
          children: [
            createCell('Distribución de grupos', { bold: true, shading: 'FFF7ED', width: 32 }),
            createCell(buildGroupsText(def.groups), { width: 68 })
          ]
        }),
        new TableRow({
          children: [
            createCell('Clasificación a eliminatorias', { bold: true, shading: 'FFF7ED', width: 32 }),
            createCell(buildQualifiersText(def.qualifiers), { width: 68 })
          ]
        })
      ]),
      docxParagraph('Aplicación de la regla', {
        heading: HeadingLevel.HEADING_2,
        color: '9A3412',
        spacing: { before: 180, after: 120 }
      }),
      docxParagraph(`Cuando una categoría tenga ${def.teamCount} jugadores, se aplicará esta configuración de grupos, vueltas, clasificación y cruces.`, {
        spacing: { after: 120, line: 300 }
      }),
      docxParagraph('La suma de jugadores asignados a los grupos debe coincidir con el número total de jugadores de la categoría. Si el reparto no es exacto, los primeros grupos recibirán el jugador adicional.', {
        spacing: { after: 180, line: 300 }
      }),
      docxParagraph('Cruces y posiciones del cuadro', {
        heading: HeadingLevel.HEADING_2,
        color: '9A3412',
        spacing: { after: 120 }
      }),
      createDocxTable([
        new TableRow({
          children: [
            createCell('Posición', { bold: true, shading: 'F3F4F6', width: 20, alignment: AlignmentType.CENTER }),
            createCell('Referencia', { bold: true, shading: 'F3F4F6', width: 80 })
          ]
        }),
        ...(positionRows.length ? positionRows : [{ slot: '-', value: 'Sin posiciones configuradas' }]).map(row => (
          new TableRow({
            children: [
              createCell(String(row.slot), { width: 20, alignment: AlignmentType.CENTER }),
              createCell(row.value, { width: 80 })
            ]
          })
        ))
      ]),
      docxParagraph('Detalle de grupos', {
        heading: HeadingLevel.HEADING_2,
        color: '9A3412',
        spacing: { before: 180, after: 120 }
      }),
      createDocxTable([
        new TableRow({
          children: [
            createCell('Grupo', { bold: true, shading: 'F3F4F6', width: 30, alignment: AlignmentType.CENTER }),
            createCell('Jugadores', { bold: true, shading: 'F3F4F6', width: 70, alignment: AlignmentType.CENTER })
          ]
        }),
        ...groupRows.map(group => (
          new TableRow({
            children: [
              createCell(group.key, { width: 30, alignment: AlignmentType.CENTER }),
              createCell(String(group.value), { width: 70, alignment: AlignmentType.CENTER })
            ]
          })
        ))
      ]),
      docxParagraph('Detalle de clasificación', {
        heading: HeadingLevel.HEADING_2,
        color: '9A3412',
        spacing: { before: 180, after: 120 }
      }),
      createDocxTable([
        new TableRow({
          children: [
            createCell('Posición', { bold: true, shading: 'F3F4F6', width: 30, alignment: AlignmentType.CENTER }),
            createCell('Regla', { bold: true, shading: 'F3F4F6', width: 70 })
          ]
        }),
        ...(qualifierRows.length ? qualifierRows : [{ position: '-', text: 'No definido' }]).map(row => (
          new TableRow({
            children: [
              createCell(String(row.position), { width: 30, alignment: AlignmentType.CENTER }),
              createCell(row.text, { width: 70 })
            ]
          })
        ))
      ])
    )

    if (index < logicData.definitions.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }
  })

  const doc = new Document({
    creator: 'OpenAI Codex',
    title: `Bases ${logicData.name}`,
    description: 'Bases de competición por número de jugadores',
    sections: [{
      properties: {},
      children
    }]
  })

  return Packer.toBlob(doc)
}

function GroupLogicPreview({ logic, onClose, onDownload, downloading }) {
  const logicData = useMemo(() => getLogicDocumentData(logic), [logic])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2,6,23,0.82)',
      zIndex: 2000,
      padding: '2rem 1rem',
      overflowY: 'auto'
    }}>
      <div className="card" style={{ maxWidth: '980px', margin: '0 auto', background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Previsualización de bases</div>
            <h2 style={{ margin: '0.2rem 0 0.35rem', fontSize: '1.8rem' }}>{logicData.name}</h2>
            <div style={{ color: '#475569' }}>{logicData.description || 'Documento generado desde el mantenimiento de lógica de grupos.'}</div>
          </div>
          <div className="flex-gap">
            <button className="btn btn-green" onClick={onDownload} disabled={downloading}>{downloading ? 'Generando DOCX...' : 'Descargar DOCX'}</button>
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '14px', background: '#ffffff', padding: '1.25rem', boxShadow: '0 14px 40px rgba(15,23,42,0.08)' }}>
          <div style={{ borderBottom: '3px solid #ea580c', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.6rem' }}>Bases de competición</h3>
            <p style={{ margin: '0.4rem 0 0', color: '#475569', lineHeight: 1.5 }}>
              Este documento resume cómo se gestionan las reglas del torneo en función del número de jugadores inscritos en cada categoría.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff7ed', padding: '0.9rem 1rem' }}>
              <strong>Leyenda de clasificación:</strong> `T` significa que pasan todos los equipos de esa posición. Si aparece un número, pasan los mejores N equipos de esa posición.
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', padding: '0.9rem 1rem' }}>
              <strong>Leyenda de cruces:</strong> una referencia como `1-3` significa el mejor tercer clasificado disponible, excluyendo a los terceros de grupo que ya estén asignados de forma fija en otras posiciones del cuadro.
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', padding: '0.9rem 1rem' }}>
              <div style={{ fontWeight: 800, color: '#9a3412', marginBottom: '0.45rem' }}>Reglas de progresión del cuadro eliminatorio</div>
              <div style={{ display: 'grid', gap: '0.45rem', lineHeight: 1.55 }}>
                <div>{TOURNAMENT_RULES.bye}</div>
                <div>{TOURNAMENT_RULES.quarterfinals}</div>
                <div>{TOURNAMENT_RULES.semifinals}</div>
                <div>{TOURNAMENT_RULES.final}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {logicData.definitions.map((def, index) => {
              const groups = getUsedGroups(def.groups)
              const qualifiers = getQualifierRows(def.qualifiers)
              const positions = getUsedPositions(def.positions, def.finals)

              return (
                <section key={`${logicData.id}-${index}`} style={{ border: '1px solid #dbe4ee', borderRadius: '14px', padding: '1rem', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Definición {index + 1}</div>
                      <h4 style={{ margin: '0.25rem 0 0', fontSize: '1.2rem' }}>{def.teamCount} jugadores por categoría</h4>
                    </div>
                    <span style={{ padding: '0.35rem 0.7rem', borderRadius: '999px', border: '1px solid #fdba74', background: '#fff7ed', color: '#9a3412', fontSize: '0.78rem', fontWeight: 700 }}>
                      {getFinalPhaseLabel(def.finals)}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.9rem' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Número de vueltas</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{def.roundTripCount || 1}</div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Distribución de grupos</div>
                      <div style={{ lineHeight: 1.5 }}>{buildGroupsText(def.groups)}</div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Clasificación a eliminatorias</div>
                      <div style={{ lineHeight: 1.5 }}>{buildQualifiersText(def.qualifiers)}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.9rem', lineHeight: 1.6 }}>
                    <strong>Aplicación de la regla.</strong> Cuando una categoría tenga {def.teamCount} jugadores, se aplicará esta configuración de grupos, vueltas, clasificación y cruces. La suma de jugadores asignados a los grupos debe coincidir con el número total de jugadores de la categoría. Si el reparto no es exacto, los primeros grupos recibirán el jugador adicional.
                  </div>

                  <div style={{ display: 'grid', gap: '0.9rem' }}>
                    <div>
                      <div style={{ marginBottom: '0.45rem', fontWeight: 700, color: '#9a3412' }}>Cruces y posiciones del cuadro</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#0f172a' }}>
                          <thead>
                            <tr>
                              <th style={{ background: '#f8fafc', border: '1px solid #dbe4ee', padding: '0.55rem', width: '90px' }}>Posición</th>
                              <th style={{ background: '#f8fafc', border: '1px solid #dbe4ee', padding: '0.55rem' }}>Referencia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(positions.length ? positions : [{ slot: '-', value: 'Sin posiciones configuradas' }]).map(row => (
                              <tr key={`${row.slot}-${row.value}`}>
                                <td style={{ border: '1px solid #dbe4ee', padding: '0.55rem', textAlign: 'center', fontWeight: 700 }}>{row.slot}</td>
                                <td style={{ border: '1px solid #dbe4ee', padding: '0.55rem' }}>{row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem' }}>
                      <div>
                        <div style={{ marginBottom: '0.45rem', fontWeight: 700, color: '#9a3412' }}>Detalle de grupos</div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#0f172a' }}>
                            <thead>
                              <tr>
                                <th style={{ background: '#f8fafc', border: '1px solid #dbe4ee', padding: '0.55rem' }}>Grupo</th>
                                <th style={{ background: '#f8fafc', border: '1px solid #dbe4ee', padding: '0.55rem' }}>Jugadores</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groups.map(group => (
                                <tr key={group.key}>
                                  <td style={{ border: '1px solid #dbe4ee', padding: '0.55rem', textAlign: 'center', fontWeight: 700 }}>{group.key}</td>
                                  <td style={{ border: '1px solid #dbe4ee', padding: '0.55rem', textAlign: 'center' }}>{group.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <div style={{ marginBottom: '0.45rem', fontWeight: 700, color: '#9a3412' }}>Detalle de clasificación</div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#0f172a' }}>
                            <thead>
                              <tr>
                                <th style={{ background: '#f8fafc', border: '1px solid #dbe4ee', padding: '0.55rem' }}>Posición</th>
                                <th style={{ background: '#f8fafc', border: '1px solid #dbe4ee', padding: '0.55rem' }}>Regla</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(qualifiers.length ? qualifiers : [{ position: '-', text: 'No definido' }]).map(row => (
                                <tr key={`${row.position}-${row.text}`}>
                                  <td style={{ border: '1px solid #dbe4ee', padding: '0.55rem', textAlign: 'center', fontWeight: 700 }}>{row.position}</td>
                                  <td style={{ border: '1px solid #dbe4ee', padding: '0.55rem' }}>{row.text}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GroupLogicManager({ readOnlyGlobal = false }) {
  const [logics, setLogics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [readOnlyMode, setReadOnlyMode] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [definitions, setDefinitions] = useState(parseConfig(JSON.stringify(defaultConfigObject)))
  const [copyFromLogicId, setCopyFromLogicId] = useState('')
  const [definitionNumberFilter, setDefinitionNumberFilter] = useState('')
  const [teamCountFilter, setTeamCountFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewLogic, setPreviewLogic] = useState(null)
  const [downloadingDocx, setDownloadingDocx] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getGroupLogics()
      setLogics(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (previewLogic) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [previewLogic])

  const resetForm = () => {
    setEditing(null)
    setReadOnlyMode(!!readOnlyGlobal)
    setName('')
    setDescription('')
    setDefinitions(parseConfig(JSON.stringify(defaultConfigObject)))
    setCopyFromLogicId('')
    setDefinitionNumberFilter('')
    setTeamCountFilter('')
    setShowForm(false)
    setError(null)
    setInfo(null)
  }

  const usedTeamCounts = useMemo(() => new Set(
    definitions
      .map(def => parseInt(def.teamCount))
      .filter(n => Number.isInteger(n) && n > 0)
  ), [definitions])

  const validateDefinitions = () => {
    const seen = new Set()
    for (const def of definitions) {
      const teamCount = parseInt(def.teamCount)
      const roundTripCount = parseInt(def.roundTripCount)
      if (!Number.isInteger(teamCount) || teamCount <= 0) throw new Error('Cada bloque debe tener un número de jugadores válido.')
      if (seen.has(teamCount)) throw new Error(`Ya existe una definición para ${teamCount} jugadores.`)
      seen.add(teamCount)

      if (!Number.isInteger(roundTripCount) || roundTripCount <= 0) throw new Error(`La definición de ${teamCount} jugadores debe tener un número de vueltas válido.`)

      const totalGrouped = GROUP_KEYS.reduce((sum, key) => sum + (parseInt(def.groups[key] || 0) || 0), 0)
      if (totalGrouped !== teamCount) throw new Error(`La suma de grupos para ${teamCount} jugadores debe ser ${teamCount}.`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (readOnlyMode || readOnlyGlobal) return
    setSaving(true)
    setError(null)
    setInfo(null)
    try {
      validateDefinitions()
      const config = serializeConfig(definitions)
      if (editing) {
        await updateGroupLogic(editing.id, { name, description, config })
        setInfo('Lógica actualizada correctamente.')
      } else {
        await createGroupLogic({ name, description, config })
        setInfo('Lógica creada correctamente.')
      }
      await load()
      window.dispatchEvent(new CustomEvent('group-logics-updated'))
      resetForm()
    } catch (e2) {
      setError(e2.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (logic) => {
    setEditing(logic)
    setReadOnlyMode(!!logic.isDefault || !!readOnlyGlobal)
    setName(logic.name)
    setDescription(logic.description || '')
    setDefinitions(parseConfig(logic.config))
    setCopyFromLogicId('')
    setDefinitionNumberFilter('')
    setTeamCountFilter('')
    setShowForm(true)
    setError(null)
    setInfo(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCopyFromLogic = (logicId) => {
    setCopyFromLogicId(logicId)
    if (!logicId) {
      setDescription('')
      setDefinitions(parseConfig(JSON.stringify(defaultConfigObject)))
      return
    }

    const sourceLogic = logics.find(logic => String(logic.id) === String(logicId))
    if (!sourceLogic) return

    setDescription(sourceLogic.description || '')
    setDefinitions(parseConfig(sourceLogic.config))
  }

  const handleDelete = async (logic) => {
    if (readOnlyGlobal) return
    if (!window.confirm(`¿Eliminar la lógica "${logic.name}"?`)) return
    setError(null)
    setInfo(null)
    try {
      await deleteGroupLogic(logic.id)
      setInfo('Lógica eliminada.')
      await load()
      window.dispatchEvent(new CustomEvent('group-logics-updated'))
    } catch (e) {
      setError(e.message)
    }
  }

  const handleOpenPreview = (logic) => {
    setPreviewLogic(logic)
    setError(null)
    setInfo(null)
  }

  const handleDownloadDocx = async (logic) => {
    setDownloadingDocx(true)
    setError(null)
    setInfo(null)
    try {
      const blob = await buildLogicDocx(logic)
      const filename = `${slugify(logic.name || 'bases') || 'bases'}.docx`
      downloadBlob(blob, filename)
      setInfo('Documento DOCX generado correctamente.')
    } catch (e) {
      console.error('Error generando DOCX:', e)
      setError('No se pudo generar el documento DOCX.')
    } finally {
      setDownloadingDocx(false)
    }
  }

  const updateDefinition = (index, updater) => {
    setDefinitions(prev => prev.map((def, idx) => idx === index ? updater(def) : def))
  }

  const addDefinition = () => {
    setDefinitions(prev => [...prev, emptyDefinition()])
  }

  const removeDefinition = (index) => {
    setDefinitions(prev => prev.filter((_, idx) => idx !== index))
  }

  const filteredDefinitions = useMemo(() => (
    definitions.filter((def, index) => {
      const matchesDefinitionNumber = !definitionNumberFilter || String(index + 1).includes(definitionNumberFilter.trim())
      const matchesTeamCount = !teamCountFilter || String(def.teamCount || '').trim() === teamCountFilter.trim()
      return matchesDefinitionNumber && matchesTeamCount
    })
  ), [definitions, definitionNumberFilter, teamCountFilter])

  return (
    <>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>🧠 Mantenimiento Lógica Grupos</div>
          {!readOnlyGlobal && (
            <button className={`btn btn-sm ${showForm ? 'btn-secondary' : 'btn-blue'}`} onClick={() => showForm ? resetForm() : setShowForm(true)}>
              {showForm ? '✖ Cerrar' : '＋ Nueva Lógica'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)' }}>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Nombre lógica</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} required readOnly={readOnlyMode} />
              </div>
              <div className="form-group" style={{ width: '180px' }}>
                <label className="form-label">Por defecto</label>
                <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={!!editing?.isDefault} readOnly />
                  <span>{editing?.isDefault ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} readOnly={readOnlyMode} />
            </div>

            {!editing && !readOnlyGlobal && (
              <div className="form-group">
                <label className="form-label">Copiar definiciones de una lógica existente</label>
                <select
                  className="form-input"
                  value={copyFromLogicId}
                  onChange={e => handleCopyFromLogic(e.target.value)}
                >
                  <option value="">Nueva lógica vacía</option>
                  {logics.map(logic => (
                    <option key={logic.id} value={logic.id}>{logic.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <strong>Definiciones por número de jugadores</strong>
              {!readOnlyMode && <button type="button" className="btn btn-secondary btn-sm" onClick={addDefinition}>+ Añadir definición</button>}
            </div>

            <div className="form-row" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Filtro nº definición</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={definitionNumberFilter}
                  onChange={e => setDefinitionNumberFilter(e.target.value)}
                  placeholder="Ej: 3"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Filtro nº jugadores</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={teamCountFilter}
                  onChange={e => setTeamCountFilter(e.target.value)}
                  placeholder="Ej: 12"
                />
              </div>
            </div>

            {filteredDefinitions.map((def) => {
              const index = definitions.indexOf(def)
              const teamCount = parseInt(def.teamCount)
              const duplicate = Number.isInteger(teamCount) && [...usedTeamCounts].filter(v => v === teamCount).length > 1
              const enabledPositionCount = getEnabledPositionCount(def.finals)
              return (
                <div key={index} className="card" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong>Definición {index + 1}</strong>
                    {!readOnlyMode && definitions.length > 1 && (
                      <button type="button" className="btn btn-red btn-sm" onClick={() => removeDefinition(index)}>🗑️</button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Número de jugadores</label>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        value={def.teamCount}
                        onChange={e => updateDefinition(index, current => ({ ...current, teamCount: e.target.value }))}
                        required
                        readOnly={readOnlyMode}
                      />
                      {duplicate && <span className="text-muted" style={{ color: '#f87171' }}>Ya existe otra definición con este número.</span>}
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Número de vueltas</label>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        value={def.roundTripCount}
                        onChange={e => updateDefinition(index, current => ({ ...current, roundTripCount: e.target.value }))}
                        required
                        readOnly={readOnlyMode}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Grupos</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 42px)', gap: '0.2rem', justifyContent: 'space-between' }}>
                      {GROUP_KEYS.map(key => (
                        <div key={key} style={{ width: '42px' }}>
                          <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem', textAlign: 'center' }}>{key}</label>
                          <input
                            className="form-input"
                            type="number"
                            min="0"
                            value={def.groups[key]}
                            onChange={e => updateDefinition(index, current => ({ ...current, groups: { ...current.groups, [key]: e.target.value } }))}
                            style={{ width: '42px', padding: '0.38rem 0.2rem', textAlign: 'center' }}
                            readOnly={readOnlyMode}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-muted" style={{ marginTop: '0.5rem' }}>
                      La suma de jugadores de cada grupo debe coincidir con el número de jugadores.
                    </div>
                    <div className="text-muted">
                      Si el número de jugadores no es múltiplo del número de grupos utilizados se deben rellenar los primeros grupos con los jugadores de más que haya.
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Paso a cuadros finales (T-Todos / X - Pasan mejores X)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 80px', gap: '0.35rem 0.75rem', alignItems: 'center', maxWidth: '260px' }}>
                      {[1, 2, 3, 4, 5].map(pos => (
                        <div key={pos} style={{ display: 'contents' }}>
                          <div style={{ fontWeight: 700 }}>{pos}</div>
                          <input
                            className="form-input"
                            value={def.qualifiers[pos]}
                            onChange={e => {
                              const raw = e.target.value.toUpperCase().trim()
                              const next = raw === 'T' ? 'T' : raw.replace(/\D/g, '').slice(0, 2)
                              updateDefinition(index, current => ({
                                ...current,
                                qualifiers: { ...current.qualifiers, [pos]: next }
                              }))
                            }}
                            style={{ textAlign: 'center' }}
                            readOnly={readOnlyMode}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-muted" style={{ marginTop: '0.5rem' }}>
                      `T` significa que pasan todos los de esa posición. Si aparece un número, pasan los mejores N de esa posición.
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Eliminatorias finales</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', gap: '0.75rem' }}>
                      {[
                        ['octavos', 'OCTAVOS DE FINAL'],
                        ['cuartos', 'CUARTOS DE FINAL'],
                        ['semifinal', 'SEMIFINAL'],
                        ['final', 'FINAL'],
                        ['playThirdFourth', 'TERCER Y CUARTO PUESTO']
                      ].map(([key, label]) => (
                        <label key={key} className="form-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{label}</span>
                          <input
                            type="checkbox"
                            checked={!!def.finals[key]}
                            onChange={e => updateDefinition(index, current => ({ ...current, finals: { ...current.finals, [key]: e.target.checked } }))}
                            disabled={readOnlyMode}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Posiciones / cruces (1-16)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 320px)', gap: '0.35rem' }}>
                      {Array.from({ length: POSITION_COUNT }, (_, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ width: '24px', textAlign: 'right', fontWeight: 700 }}>{idx + 1}</span>
                          <input
                            className="form-input"
                            value={def.positions[idx]}
                            disabled={idx >= enabledPositionCount || readOnlyMode}
                            onChange={e => updateDefinition(index, current => {
                              const positions = [...current.positions]
                              positions[idx] = e.target.value
                              return { ...current, positions }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="flex-gap">
              {!readOnlyMode && (
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Guardando...' : editing ? 'Guardar Cambios' : 'Crear Lógica'}</button>
              )}
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {info && <div className="alert alert-success">{info}</div>}

        {loading ? <div className="spinner" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {logics.map(logic => {
              const locked = logic.isDefault
              const definitionsPreview = parseConfig(logic.config)
              return (
                <div key={logic.id} className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <strong>{logic.name}</strong>
                        {logic.isDefault && <span className="badge badge-success">POR DEFECTO</span>}
                        {(logic._count?.tournaments || 0) > 0 && <span className="badge badge-blue">{logic._count.tournaments} torneo(s)</span>}
                      </div>
                      {logic.description && <div className="text-muted" style={{ marginBottom: '0.5rem' }}>{logic.description}</div>}
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Definiciones: {definitionsPreview.map(def => `${def.teamCount} jugadores`).join(', ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-blue btn-sm" onClick={() => handleOpenPreview(logic)}>Ver Bases</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(logic)}>{locked || readOnlyGlobal ? '👁️' : '✏️'}</button>
                      {!readOnlyGlobal && <button className="btn btn-red btn-sm" disabled={locked} onClick={() => handleDelete(logic)}>🗑️</button>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {previewLogic && (
        <GroupLogicPreview
          logic={previewLogic}
          onClose={() => setPreviewLogic(null)}
          onDownload={() => handleDownloadDocx(previewLogic)}
          downloading={downloadingDocx}
        />
      )}
    </>
  )
}
