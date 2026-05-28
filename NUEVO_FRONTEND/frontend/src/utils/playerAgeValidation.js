function parseDate(value) {
  if (!value || typeof value !== 'string') return null
  const parts = value.trim().split(/[/-]/).map(Number)
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null
  return new Date(year, month - 1, day)
}

export function validatePlayerAgeFrontend(birthDateStr, fromStr, toStr, isVeteran) {
  if (!birthDateStr || (!fromStr && !toStr)) return { ok: true }

  const birthDate = parseDate(birthDateStr)
  const fromDate = fromStr ? parseDate(fromStr) : null
  const toDate = toStr ? parseDate(toStr) : null

  if (!birthDate) return { ok: true }

  if (isVeteran) {
    if (toDate && birthDate > toDate) {
      return { ok: false, error: 'Demasiado joven para esta categoría Veterano' }
    }
  } else {
    if (fromDate && birthDate < fromDate) {
      return { ok: false, error: 'Demasiado mayor para esta categoría' }
    }
    if (toDate && birthDate > toDate) {
      return { ok: true, warning: 'Aviso: Jugador en categoría superior (más joven de lo habitual)' }
    }
  }

  return { ok: true }
}

function formatCategoryRange(category) {
  if (!category) return 'sin rango definido'
  const from = category.minAge || 'sin desde'
  const to = category.maxAge || 'sin hasta'
  if (category.isVeteran) {
    return `Veterano · nacidos entre ${from} y ${to}`
  }
  return `Entre ${from} y ${to}`
}

export function getPlayerAgeIssue(player, category) {
  if (!player || !category) return null
  const result = validatePlayerAgeFrontend(
    player.birthDate,
    category.minAge,
    category.maxAge,
    category.isVeteran
  )
  if (result.ok !== false) return null
  const birthDate = player.birthDate || 'sin fecha informada'
  const range = formatCategoryRange(category)
  const reason = result.error || 'Edad no válida para la categoría'
  return `${reason}. Fecha del jugador: ${birthDate}. Rango de la categoría: ${range}.`
}

export function teamHasAgeIssue(team, category = team?.category) {
  return Array.isArray(team?.players) && team.players.some(player => !!getPlayerAgeIssue(player, category))
}

export function getTeamAgeIssue(team, category = team?.category) {
  if (!Array.isArray(team?.players) || team.players.length === 0) return null
  const invalidPlayers = team.players
    .map(player => {
      const issue = getPlayerAgeIssue(player, category)
      if (!issue) return null
      const fullName = [player.lastName, player.name].filter(Boolean).join(', ')
      return `${fullName || player.name || 'Jugador'}: ${issue}`
    })
    .filter(Boolean)

  if (invalidPlayers.length === 0) return null

  return [
    'Este equipo tiene jugadores fuera del rango de edad de la categoria:',
    ...invalidPlayers
  ].join(' ')
}
