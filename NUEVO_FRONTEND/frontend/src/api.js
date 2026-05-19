export const BASE = 'https://saskipenguins.com/api-3x3'

async function req(method, path, body) {
  const separator = path.includes('?') ? '&' : '?'
  const url = method === 'GET' ? `${BASE}${path}${separator}t=${Date.now()}` : `${BASE}${path}`
  
  const res = await fetch(url, {
    method,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch (e) {
    throw new Error(`Respuesta inválida del servidor (${res.status}): ${text.substring(0, 50)}`)
  }

  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Tournaments
export const getTournaments = () => req('GET', '/tournaments')
export const getTournament = (id) => req('GET', `/tournaments/${id}`)
export const createTournament = (data) => req('POST', '/tournaments', data)
export const updateTournament = (id, data) => req('PUT', `/tournaments/${id}`, data)
export const deleteTournament = (id) => req('DELETE', `/tournaments/${id}`)
export const cloneTournament = (id, data) => req('POST', `/tournaments/${id}/clone`, data)
export const getGroupLogics = () => req('GET', '/group-logics')
export const createGroupLogic = (data) => req('POST', '/group-logics', data)
export const updateGroupLogic = (id, data) => req('PUT', `/group-logics/${id}`, data)
export const deleteGroupLogic = (id) => req('DELETE', `/group-logics/${id}`)

// Categories
export const getCategories = (tid) => req('GET', `/tournaments/${tid}/categories`)
export const createCategory = (tid, data) => req('POST', `/tournaments/${tid}/categories`, data)
export const updateCategory = (tid, id, data) => req('PUT', `/tournaments/${tid}/categories/${id}`, data)
export const deleteCategory = (tid, id) => req('DELETE', `/tournaments/${tid}/categories/${id}`)
export const bulkImport = (tid, rows) => req('POST', `/tournaments/${tid}/bulk-import`, { rows })

// Teams
export const getTeams = (cid) => req('GET', `/categories/${cid}/teams`)
export const createTeam = (cid, data) => req('POST', `/categories/${cid}/teams`, data)
export const bulkCreateTeams = (cid, teams) => req('POST', `/categories/${cid}/teams/bulk`, { teams })
export const updateTeam = (id, data) => req('PUT', `/teams/${id}`, data)
export const deleteTeam = (id) => req('DELETE', `/teams/${id}`)

// Players
export const createPlayer = (teamId, data) => req('POST', `/teams/${teamId}/players`, data)
export const updatePlayer = (id, data) => req('PUT', `/players/${id}`, data)
export const deletePlayer = (id) => req('DELETE', `/players/${id}`)
export const getPlayerDirectory = (tid, params) => {
  const q = new URLSearchParams(params).toString()
  return req('GET', `/tournaments/${tid}/players-directory?${q}`)
}

// Matches
export const getMatches = (tid) => req('GET', `/tournaments/${tid}/matches`)
export const generateMatches = (tid, cid) => req('POST', `/tournaments/${tid}/categories/${cid}/generate-matches`, {})
export const deleteCategoryMatches = (cid, type) => req('DELETE', `/categories/${cid}/matches${type ? `?type=${type}` : ''}`)
export const updateScore = (id, homeScore, awayScore, homeFouls, awayFouls, observations, status, officialName, gameTime, sessionKey) => req('PUT', `/matches/${id}/score`, { homeScore, awayScore, homeFouls, awayFouls, observations, status, officialName, gameTime, sessionKey })

// Schedule
export const getSchedule = (tid) => req('GET', `/tournaments/${tid}/schedule`)
export const createSchedule = (tid, config) => req('POST', `/tournaments/${tid}/schedule`, config)
export const deleteSchedule = (tid) => req('DELETE', `/tournaments/${tid}/schedule`)
export const updateScheduleSlot = (id, data) => req('PATCH', `/schedule/${id}`, data)

// Jornadas
export const getJornadas = (tid) => req('GET', `/tournaments/${tid}/jornadas`)
export const createJornada = (tid, data) => req('POST', `/tournaments/${tid}/jornadas`, data)
export const deleteJornada = (tid, id) => req('DELETE', `/tournaments/${tid}/jornadas/${id}`)

// Standings
export const getStandings = (cid) => req('GET', `/categories/${cid}/standings`)
export const getFinalRanking = (cid) => req('GET', `/categories/${cid}/final-ranking`)

// Final Phase
export const generateFinalPhase = (cid) => req('POST', `/categories/${cid}/generate-final-phase`, {})

// Activation & Scoreboard
export const getActiveTournament = () => req('GET', '/tournaments/active')
export const activateTournament = (id, active) => req('PATCH', `/tournaments/${id}/activate`, { active })
export const updateTournamentTimer = (id, timerRemainingSeconds, timerRunning) => req('PUT', `/tournaments/${id}/timer`, { timerRemainingSeconds, timerRunning })
export const activateMatch = (id, active, officialName) => req('PUT', `/matches/${id}/activate`, { active, officialName })
export const joinMatch = (id, officialName, sessionKey, officialId) => req('POST', `/matches/${id}/join`, { officialName, sessionKey, officialId })
export const exitMatch = (id, officialName, sessionKey) => req('POST', `/matches/${id}/exit`, { officialName, sessionKey })
export const getActiveMatch = (tid, court) => req('GET', `/matches/active/${tid}/${court}`)
export const getMatchLogs = (tid, number) => req('GET', `/tournaments/${tid}/matches/logs/${number}`)

// Officials (Oficiales de Mesa)
export const getOfficials = (tid) => req('GET', `/tournaments/${tid}/officials`)
export const createOfficial = (tid, data) => req('POST', `/tournaments/${tid}/officials`, data)
export const updateOfficial = (tid, id, data) => req('PUT', `/tournaments/${tid}/officials/${id}`, data)
export const deleteOfficial = (tid, id) => req('DELETE', `/tournaments/${tid}/officials/${id}`)

// Courts
export const getCourts = (tid) => req('GET', `/tournaments/${tid}/courts`)
export const createCourt = (tid, data) => req('POST', `/tournaments/${tid}/courts`, data)
export const deleteCourt = (tid, id) => req('DELETE', `/tournaments/${tid}/courts/${id}`)

// Court Configs
export const updateCourtConfigs = (tid, data) => req('POST', `/tournaments/${tid}/court-configs`, data)

// Image Upload
export const uploadImage = (file) => {

  const formData = new FormData()
  formData.append('image', file)
  return fetch(`${BASE}/upload`, {
    method: 'POST',
    body: formData,
  }).then(async res => {
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
    return data
  })
}
