import { useEffect, useMemo, useState } from 'react'
import {
  closeUserOtherSessions,
  closeUserSessions,
  createUser,
  deleteUser,
  getAuditEvents,
  getTournaments,
  getUsers,
  updateUser
} from '../api'

const EMPTY_FORM = {
  username: '',
  firstName: '',
  lastName1: '',
  lastName2: '',
  email: '',
  password: '',
  isSuperAdmin: false,
  active: true,
  tournamentIds: []
}

export default function UserManager({ currentUser }) {
  const [users, setUsers] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [auditEvents, setAuditEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [auditQuery, setAuditQuery] = useState('')
  const [auditUserFilter, setAuditUserFilter] = useState('all')
  const [auditTypeFilter, setAuditTypeFilter] = useState('all')
  const [auditEntityFilter, setAuditEntityFilter] = useState('all')
  const [auditTournamentFilter, setAuditTournamentFilter] = useState('all')
  const [auditDateFrom, setAuditDateFrom] = useState('')
  const [auditDateTo, setAuditDateTo] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const canViewAudit = !!currentUser?.isSuperAdmin

  const formatSessionDate = (value) => {
    if (!value) return 'Sin dato'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Sin dato'
    return date.toLocaleString('es-ES')
  }

  const formatUserAgent = (value) => {
    const text = String(value || '').trim()
    if (!text) return 'Navegador no identificado'
    return text.length > 90 ? `${text.slice(0, 90)}...` : text
  }

  const formatAuditType = (value) => {
    const labels = {
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'user.create': 'Alta usuario',
      'user.update': 'Edicion usuario',
      'user.update_password': 'Cambio password',
      'user.delete': 'Borrado usuario',
      'session.close_all': 'Cerrar sesiones',
      'session.close_others': 'Cerrar otras sesiones',
      'tournament.create': 'Alta torneo',
      'tournament.update': 'Edicion torneo',
      'tournament.delete': 'Borrado torneo',
      'group_logic.create': 'Alta logica grupos',
      'group_logic.update': 'Edicion logica grupos',
      'group_logic.delete': 'Borrado logica grupos'
    }
    return labels[value] || value || 'Evento'
  }

  const formatAuditResult = (value) => {
    const labels = {
      success: 'Exito',
      validation_rejected: 'Rechazo validacion',
      permission_rejected: 'Rechazo permisos'
    }
    return labels[value] || value || 'Sin dato'
  }

  const getAuditResultBadgeStyle = (value) => {
    if (value === 'permission_rejected') {
      return { background: 'rgba(220,38,38,0.18)', color: '#fecaca', border: '1px solid rgba(248,113,113,0.35)' }
    }
    if (value === 'validation_rejected') {
      return { background: 'rgba(245,158,11,0.16)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.35)' }
    }
    return { background: 'rgba(34,197,94,0.16)', color: '#bbf7d0', border: '1px solid rgba(74,222,128,0.35)' }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [usersData, tournamentsData, auditData] = await Promise.all([
        getUsers(),
        getTournaments(),
        getAuditEvents()
      ])
      setUsers(usersData)
      setTournaments(tournamentsData)
      setAuditEvents(auditData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const sortedTournaments = useMemo(
    () => [...tournaments].sort((a, b) => a.name.localeCompare(b.name)),
    [tournaments]
  )

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return users.filter(user => {
      const fullName = `${user.firstName} ${user.lastName1} ${user.lastName2 || ''}`.toLowerCase()
      const tournamentsText = (user.tournamentAccesses || []).map(access => access.tournament?.name || '').join(' ').toLowerCase()
      const matchesQuery = !normalizedQuery
        || user.username.toLowerCase().includes(normalizedQuery)
        || user.email.toLowerCase().includes(normalizedQuery)
        || fullName.includes(normalizedQuery)
        || tournamentsText.includes(normalizedQuery)
      const matchesRole = roleFilter === 'all'
        || (roleFilter === 'superadmin' && user.isSuperAdmin)
        || (roleFilter === 'operator' && !user.isSuperAdmin)
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && user.active)
        || (statusFilter === 'inactive' && !user.active)
      return matchesQuery && matchesRole && matchesStatus
    })
  }, [users, query, roleFilter, statusFilter])

  const filteredAuditEvents = useMemo(() => {
    const normalizedQuery = auditQuery.trim().toLowerCase()
    return auditEvents.filter(event => {
      const eventDate = new Date(event.createdAt)
      const eventDateKey = Number.isNaN(eventDate.getTime()) ? '' : eventDate.toISOString().slice(0, 10)
      const matchesUser = auditUserFilter === 'all'
        || event.targetUser?.username === auditUserFilter
        || event.actorUser?.username === auditUserFilter
      const matchesType = auditTypeFilter === 'all' || event.eventType === auditTypeFilter
      const matchesEntity = auditEntityFilter === 'all' || event.entityType === auditEntityFilter
      const eventTournamentKey = event.tournament?.id ? String(event.tournament.id) : (event.tournament?.name || '')
      const matchesTournament = auditTournamentFilter === 'all' || eventTournamentKey === auditTournamentFilter
      const matchesFrom = !auditDateFrom || (eventDateKey && eventDateKey >= auditDateFrom)
      const matchesTo = !auditDateTo || (eventDateKey && eventDateKey <= auditDateTo)
      const haystack = [
        event.eventType,
        event.entityType,
        event.result,
        event.reason,
        event.details,
        event.targetUser?.username,
        event.actorUser?.username,
        event.tournament?.name,
        event.ipAddress
      ].join(' ').toLowerCase()
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
      return matchesUser && matchesType && matchesEntity && matchesTournament && matchesFrom && matchesTo && matchesQuery
    })
  }, [auditEntityFilter, auditEvents, auditDateFrom, auditDateTo, auditQuery, auditTournamentFilter, auditTypeFilter, auditUserFilter])

  const auditUsers = useMemo(() => {
    const map = new Map()
    auditEvents.forEach(event => {
      if (event.targetUser?.username && !map.has(event.targetUser.username)) {
        map.set(event.targetUser.username, event.targetUser)
      }
      if (event.actorUser?.username && !map.has(event.actorUser.username)) {
        map.set(event.actorUser.username, event.actorUser)
      }
    })
    return [...map.values()].sort((a, b) => (a.username || '').localeCompare(b.username || ''))
  }, [auditEvents])

  const auditTypes = useMemo(() => {
    const values = new Set()
    auditEvents.forEach(event => {
      if (event.eventType) values.add(event.eventType)
    })
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [auditEvents])

  const auditEntityTypes = useMemo(() => {
    const values = new Set()
    auditEvents.forEach(event => {
      if (event.entityType) values.add(event.entityType)
    })
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [auditEvents])

  const auditTournaments = useMemo(() => {
    const map = new Map()
    auditEvents.forEach(event => {
      if (!event.tournament?.name && !event.tournament?.id) return
      const key = event.tournament?.id ? String(event.tournament.id) : event.tournament.name
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: event.tournament?.name || `Torneo ${event.tournament?.id}`
        })
      }
    })
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [auditEvents])

  const stats = useMemo(() => ({
    total: users.length,
    superadmins: users.filter(user => user.isSuperAdmin).length,
    operators: users.filter(user => !user.isSuperAdmin).length,
    inactive: users.filter(user => !user.active).length
  }), [users])

  const selectedTournamentCount = form.tournamentIds.length

  const resetForm = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(false)
    setError('')
    setInfo('')
  }

  const openNewUser = () => {
    setShowAudit(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setError('')
    setInfo('')
  }

  const openUsersMaintenance = () => {
    setShowAudit(false)
    setShowForm(false)
    setEditing(null)
    setError('')
    setInfo('')
  }

  const openAudit = () => {
    setShowForm(false)
    setEditing(null)
    setShowAudit(true)
    setError('')
    setInfo('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setInfo('')
    try {
      if (editing) {
        await updateUser(editing.id, form)
        setInfo(`Usuario ${form.username} actualizado.`)
      } else {
        await createUser(form)
        setInfo(`Usuario ${form.username} creado.`)
      }
      await load()
      resetForm()
    } catch (e2) {
      setError(e2.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (user) => {
    setShowAudit(false)
    setEditing(user)
    setForm({
      username: user.username || '',
      firstName: user.firstName || '',
      lastName1: user.lastName1 || '',
      lastName2: user.lastName2 || '',
      email: user.email || '',
      password: '',
      isSuperAdmin: !!user.isSuperAdmin,
      active: user.active !== false,
      tournamentIds: (user.tournamentAccesses || []).map(access => access.tournamentId)
    })
    setShowForm(true)
    setError('')
    setInfo('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`¿Eliminar el usuario ${user.username}?`)) return
    setError('')
    setInfo('')
    try {
      await deleteUser(user.id)
      setInfo(`Usuario ${user.username} eliminado.`)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const requestClosureReason = (user, keepCurrentSession) => {
    const actionLabel = keepCurrentSession ? 'cerrar sesiones salvo la actual' : 'cerrar todas las sesiones'
    const reason = window.prompt(`Indica el motivo para ${actionLabel} de ${user.username}:`, '')
    if (reason === null) return null
    const normalized = reason.trim()
    if (!normalized) {
      setError('Debes indicar un motivo para registrar el cierre forzado de sesiones.')
      return null
    }
    return normalized
  }

  const handleCloseSessions = async (user, keepCurrentSession = false) => {
    const message = keepCurrentSession
      ? `¿Cerrar las sesiones de ${user.username} salvo la actual?`
      : `¿Cerrar todas las sesiones activas de ${user.username}?`
    if (!window.confirm(message)) return
    const reason = requestClosureReason(user, keepCurrentSession)
    if (!reason) return
    setError('')
    setInfo('')
    try {
      const result = keepCurrentSession
        ? await closeUserOtherSessions(user.id, reason)
        : await closeUserSessions(user.id, reason)
      await load()
      setInfo(
        result.keptCurrentSession
          ? `Se han cerrado ${result.closedSessions} sesión(es) de ${user.username}. La sesión actual se ha mantenido abierta por seguridad.`
          : `Se han cerrado ${result.closedSessions} sesión(es) de ${user.username}.`
      )
    } catch (e) {
      setError(e.message)
    }
  }

  const toggleTournament = (tournamentId) => {
    setForm(prev => ({
      ...prev,
      tournamentIds: prev.tournamentIds.includes(tournamentId)
        ? prev.tournamentIds.filter(id => id !== tournamentId)
        : [...prev.tournamentIds, tournamentId]
    }))
  }

  const setAllTournaments = () => {
    setForm(prev => ({
      ...prev,
      tournamentIds: sortedTournaments.map(tournament => tournament.id)
    }))
  }

  const clearTournamentSelection = () => {
    setForm(prev => ({ ...prev, tournamentIds: [] }))
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <div className="card-title" style={{ marginBottom: '0.35rem' }}>Usuarios de Administración</div>
          <div className="text-muted">Gestiona accesos, reasigna torneos, resetea passwords y consulta la auditoría de seguridad.</div>
        </div>
        <div className="flex-gap">
          {showAudit ? (
            <button className="btn btn-sm btn-blue" onClick={openUsersMaintenance}>
              Mantenimiento usuarios
            </button>
          ) : (
            <button className={`btn btn-sm ${showForm ? 'btn-secondary' : 'btn-blue'}`} onClick={() => showForm ? resetForm() : openNewUser()}>
              {showForm ? 'Cerrar formulario' : 'Nuevo usuario'}
            </button>
          )}
          {canViewAudit && !showAudit && (
            <button className="btn btn-sm btn-secondary" onClick={openAudit}>
              Ver auditoría
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={load}>Actualizar</button>
        </div>
      </div>

      {!showAudit && (
        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.03))', borderColor: 'rgba(249,115,22,0.35)' }}>
            <div className="text-muted">Usuarios totales</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)' }}>{stats.total}</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.03))', borderColor: 'rgba(34,197,94,0.35)' }}>
            <div className="text-muted">Superadministradores</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)' }}>{stats.superadmins}</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.03))', borderColor: 'rgba(59,130,246,0.35)' }}>
            <div className="text-muted">Operadores</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)' }}>{stats.operators}</div>
            {stats.inactive > 0 && <div className="text-muted" style={{ marginTop: '0.25rem' }}>{stats.inactive} inactivo(s)</div>}
          </div>
        </div>
      )}

      {canViewAudit && showAudit && (
        <div className="card" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
            <div>
              <div className="card-title" style={{ marginBottom: '0.2rem' }}>Auditoría de seguridad</div>
              <div className="text-muted">Eventos sensibles recientes: sesiones, usuarios, torneos y lógica de grupos.</div>
            </div>
            <div className="badge badge-blue">Eventos: {auditEvents.length}</div>
          </div>
          <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ flex: 1.1 }}>
              <label className="form-label">Usuario</label>
              <select className="form-input" value={auditUserFilter} onChange={e => setAuditUserFilter(e.target.value)}>
                <option value="all">Todos</option>
                {auditUsers.map(user => (
                  <option key={user.id || user.username} value={user.username}>{user.username}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Fecha desde</label>
              <input className="form-input" type="date" value={auditDateFrom} onChange={e => setAuditDateFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Fecha hasta</label>
              <input className="form-input" type="date" value={auditDateTo} onChange={e => setAuditDateTo(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Tipo registro</label>
              <select className="form-input" value={auditTypeFilter} onChange={e => setAuditTypeFilter(e.target.value)}>
                <option value="all">Todos</option>
                {auditTypes.map(type => (
                  <option key={type} value={type}>{formatAuditType(type)}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Entidad</label>
              <select className="form-input" value={auditEntityFilter} onChange={e => setAuditEntityFilter(e.target.value)}>
                <option value="all">Todas</option>
                {auditEntityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ flex: 1.1 }}>
              <label className="form-label">Torneo</label>
              <select className="form-input" value={auditTournamentFilter} onChange={e => setAuditTournamentFilter(e.target.value)}>
                <option value="all">Todos</option>
                {auditTournaments.map(tournament => (
                  <option key={tournament.key} value={tournament.key}>{tournament.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label className="form-label">Texto</label>
            <input
              className="form-input"
              value={auditQuery}
              onChange={e => setAuditQuery(e.target.value)}
              placeholder="Motivo, actor, usuario, torneo o tipo"
            />
          </div>
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {filteredAuditEvents.length === 0 && (
              <div className="form-input text-muted">No hay eventos de auditoría que coincidan con el filtro.</div>
            )}
            {filteredAuditEvents.map(event => (
              <div key={event.id} className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                  <span className="badge badge-blue">{formatSessionDate(event.createdAt)}</span>
                  <span className="badge badge-pending">{formatAuditType(event.eventType)}</span>
                  <span className="badge" style={getAuditResultBadgeStyle(event.result)}>{formatAuditResult(event.result)}</span>
                  {event.entityType && <span className="badge badge-blue">{event.entityType}</span>}
                  {event.tournament?.name && <span className="badge badge-played">{event.tournament.name}</span>}
                  {event.metadata?.closedSessionCount !== undefined && (
                    <span className="badge badge-success">Sesiones cerradas: {event.metadata.closedSessionCount}</span>
                  )}
                </div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                  {event.targetUser?.username || event.tournament?.name || event.entityType || 'Evento'}
                </div>
                <div className="text-muted" style={{ marginBottom: '0.25rem' }}>
                  Actor: {event.actorUser?.username || 'Sistema'}
                </div>
                {event.details && <div style={{ color: 'var(--text)', lineHeight: 1.45, marginBottom: event.reason ? '0.25rem' : 0 }}>{event.details}</div>}
                {event.reason && <div className="text-muted">Motivo: {event.reason}</div>}
                {(event.ipAddress || event.userAgent) && (
                  <div className="text-muted" style={{ marginTop: '0.25rem', fontSize: '0.82rem' }}>
                    IP aprox.: {event.ipAddress || 'No disponible'} · {formatUserAgent(event.userAgent)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!showAudit && (
        <div className="card" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)' }}>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Buscar</label>
              <input
                className="form-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Usuario, nombre, mail o torneo"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Rol</label>
              <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="superadmin">Superadmin</option>
                <option value="operator">Operador</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Estado</label>
              <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {!showAudit && showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '1rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div className="card-title" style={{ marginBottom: '0.25rem' }}>
                {editing ? `Editar ${editing.username}` : 'Alta de usuario'}
              </div>
              <div className="text-muted">
                {editing ? 'Si rellenas password, se sustituirá por una nueva.' : 'Crea un usuario y asígnale los torneos que podrá administrar.'}
              </div>
            </div>
            {editing && <span className="badge badge-blue">Edición</span>}
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Usuario</label>
              <input className="form-input" value={form.username} onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nombre</label>
              <input className="form-input" value={form.firstName} onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Apellido 1</label>
              <input className="form-input" value={form.lastName1} onChange={e => setForm(prev => ({ ...prev, lastName1: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Apellido 2</label>
              <input className="form-input" value={form.lastName2} onChange={e => setForm(prev => ({ ...prev, lastName2: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1.2 }}>
              <label className="form-label">Mail</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Password {editing ? '(reset opcional)' : ''}</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} required={!editing} />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: '0.5rem' }}>
            <label className="form-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minHeight: '48px' }}>
              <span>Superadministrador</span>
              <input
                type="checkbox"
                checked={form.isSuperAdmin}
                onChange={e => setForm(prev => ({ ...prev, isSuperAdmin: e.target.checked, tournamentIds: e.target.checked ? [] : prev.tournamentIds }))}
              />
            </label>
            <label className="form-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minHeight: '48px' }}>
              <span>Usuario activo</span>
              <input type="checkbox" checked={form.active} onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))} />
            </label>
          </div>

          {!form.isSuperAdmin && (
            <div className="card" style={{ background: 'rgba(15,23,42,0.45)', borderColor: 'rgba(59,130,246,0.25)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div>
                  <div className="card-title" style={{ marginBottom: '0.25rem' }}>Torneos asignados</div>
                  <div className="text-muted">{selectedTournamentCount} seleccionado(s)</div>
                </div>
                <div className="flex-gap">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={setAllTournaments}>Seleccionar todos</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearTournamentSelection}>Vaciar</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.6rem' }}>
                {sortedTournaments.map(tournament => {
                  const checked = form.tournamentIds.includes(tournament.id)
                  return (
                    <label
                      key={tournament.id}
                      className="form-input"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        cursor: 'pointer',
                        minHeight: '52px',
                        borderColor: checked ? 'var(--accent)' : 'var(--border)',
                        background: checked ? 'rgba(249,115,22,0.10)' : 'var(--bg3)'
                      }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleTournament(tournament.id)} />
                      <span style={{ fontWeight: checked ? 700 : 500 }}>{tournament.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          <div className="flex-gap">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar usuario' : 'Crear usuario'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}

      {error && !showForm && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      {!showAudit && (loading ? <div className="spinner" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredUsers.length === 0 && (
            <div className="card text-center text-muted">No hay usuarios que coincidan con los filtros actuales.</div>
          )}
          {filteredUsers.map(user => (
            <div key={user.id} className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '1rem' }}>{user.username}</strong>
                    {user.isSuperAdmin && <span className="badge badge-success">SUPERADMIN</span>}
                    {!user.isSuperAdmin && <span className="badge badge-blue">OPERADOR</span>}
                    {!user.active && <span className="badge badge-pending">INACTIVO</span>}
                  </div>
                  <div className="text-muted" style={{ marginBottom: '0.35rem' }}>
                    {user.firstName} {user.lastName1} {user.lastName2 || ''} · {user.email}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                    <span className="badge badge-pending">Sesiones: {user.sessionCount ?? 0}</span>
                    {!user.isSuperAdmin && <span className="badge badge-played">Torneos: {(user.tournamentAccesses || []).length}</span>}
                  </div>
                  {(user.sessions || []).length > 0 && (
                    <div className="card" style={{ marginTop: '0.75rem', padding: '0.8rem', background: 'rgba(15,23,42,0.35)', borderColor: 'rgba(59,130,246,0.18)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                        <div style={{ fontWeight: 700 }}>Sesiones activas</div>
                        <div className="flex-gap">
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleCloseSessions(user, true)}>
                            Cerrar salvo actual
                          </button>
                          <button type="button" className="btn btn-red btn-sm" onClick={() => handleCloseSessions(user, false)}>
                            Cerrar todas
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: '0.55rem' }}>
                        {user.sessions.map(session => (
                          <div key={session.id} className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                              <span className="badge badge-blue">Alta: {formatSessionDate(session.createdAt)}</span>
                              <span className="badge badge-success">Última actividad: {formatSessionDate(session.lastSeenAt)}</span>
                              <span className="badge badge-pending">Expira: {formatSessionDate(session.expiresAt)}</span>
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.82rem' }}>
                              IP aprox.: {session.ipAddress || 'No disponible'} · {formatUserAgent(session.userAgent)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!user.isSuperAdmin && (
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {(user.tournamentAccesses || []).map(access => access.tournament?.name).join(', ') || 'Sin torneos asignados'}
                    </div>
                  )}
                </div>
                <div className="flex-gap">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(user)}>Editar</button>
                  <button className="btn btn-red btn-sm" onClick={() => handleDelete(user)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
