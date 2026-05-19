import { useState, useEffect } from 'react'
import { uploadImage, updateTournament } from '../api'
import { resolveImageUrl } from '../utils/tournamentBranding'
// import ReactQuill from 'react-quill'
// import 'react-quill/dist/quill.snow.css'


// Configuración del editor Quill
const modules = {
  toolbar: [
    [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'clean']
  ],
}

const formats = [
  'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'list', 'bullet',
  'link'
]

export default function TournamentInfo({ tournament, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    rules: '',
    contactInfo: '',
    locationInfo: '',
    generalInfo: '',
    eventPosterUrl: '',
    cafePosterUrl: '',
    sponsorsImageUrl: '',
    headerLogoUrl: '',
    backgroundLogoUrl: '',
    strictScheduleMode: false,
    matchDuration: 15,
    matchPlayTime: 10,
  })

  // Archivos locales seleccionados pero no subidos aún
  const [pendingFiles, setPendingFiles] = useState({ eventPosterUrl: null, cafePosterUrl: null, sponsorsImageUrl: null, headerLogoUrl: null, backgroundLogoUrl: null })
  // URLs de previsualización para archivos locales
  const [previews, setPreviews] = useState({ eventPosterUrl: null, cafePosterUrl: null, sponsorsImageUrl: null, headerLogoUrl: null, backgroundLogoUrl: null })

  useEffect(() => {
    setForm({
      rules: tournament.rules || '',
      contactInfo: tournament.contactInfo || '',
      locationInfo: tournament.locationInfo || '',
      generalInfo: tournament.generalInfo || '',
      eventPosterUrl: tournament.eventPosterUrl || '',
      cafePosterUrl: tournament.cafePosterUrl || '',
      sponsorsImageUrl: tournament.sponsorsImageUrl || '',
      headerLogoUrl: tournament.headerLogoUrl || '',
      backgroundLogoUrl: tournament.backgroundLogoUrl || '',
      strictScheduleMode: !!tournament.strictScheduleMode,
      matchDuration: tournament.matchDuration || 15,
      matchPlayTime: tournament.matchPlayTime || 10,
    })
    setPendingFiles({ eventPosterUrl: null, cafePosterUrl: null, sponsorsImageUrl: null, headerLogoUrl: null, backgroundLogoUrl: null })
    setPreviews({ eventPosterUrl: null, cafePosterUrl: null, sponsorsImageUrl: null, headerLogoUrl: null, backgroundLogoUrl: null })
  }, [tournament, editing]) // Reseteamos al entrar/salir de edición

  const handleFileSelect = (field, file) => {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setPendingFiles(prev => ({ ...prev, [field]: file }))
    setPreviews(prev => ({ ...prev, [field]: previewUrl }))
    // Al seleccionar local, vaciamos el campo de URL en el form temporal
    setForm(f => ({ ...f, [field]: '' }))
  }

  const handleClearImage = (field) => {
    setPendingFiles(prev => ({ ...prev, [field]: null }))
    setPreviews(prev => ({ ...prev, [field]: null }))
    setForm(f => ({ ...f, [field]: '' }))
  }

  const totalTeams = tournament?.categories?.reduce((acc, cat) => acc + (cat.teams?.length || 0), 0) || 0
  const totalPlayers = tournament?.categories?.reduce((acc, cat) => {
    const catPlayers = cat.teams?.reduce((acc2, t) => acc2 + (t._count?.players || t.players?.length || 0), 0) || 0
    return acc + catPlayers
  }, 0) || 0
  const totalMatches = tournament?.categories?.reduce((acc, cat) => acc + (cat.matches?.length || 0), 0) || 0

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const finalForm = { ...form }

      if (finalForm.matchDuration < finalForm.matchPlayTime) {
        throw new Error("❌ La duración de la ronda no puede ser menor que el tiempo de juego del partido.")
      }

      // Subir archivos pendientes si los hay
      for (const field of ['eventPosterUrl', 'cafePosterUrl', 'sponsorsImageUrl', 'headerLogoUrl', 'backgroundLogoUrl']) {
        if (pendingFiles[field]) {
          const { url } = await uploadImage(pendingFiles[field])
          finalForm[field] = url
        }
      }

      const updated = await updateTournament(tournament.id, finalForm)
      onUpdate(updated)
      setInfo('✅ Información guardada correctamente')
      setEditing(false)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const renderSection = ({ icon, label, field, placeholder }) => (
    <div key={field} className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {icon} {label}
      </div>
      {editing ? (
        <div className="quill-editor-wrapper">
          <textarea
            className="form-input"
            style={{ width: '100%', minHeight: '150px', background: 'var(--bg2)', color: 'var(--text)' }}
            value={form[field]}
            onChange={e => handleChange(field, e.target.value)}
            placeholder={placeholder}
          />
        </div>
      ) : form[field] && form[field] !== '<p><br></p>' ? (
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: form[field] }} />
      ) : (
        <div className="text-muted" style={{ fontStyle: 'italic' }}>Sin información. Haz clic en ✏️ Editar para añadir.</div>
      )}
    </div>
  )

  const renderPosterSection = ({ icon, label, field, placeholder }) => {
    const currentImageUrl = previews[field] || resolveImageUrl(form[field])
    const hasImage = !!(previews[field] || form[field])

    return (
      <div key={field} className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          {icon} {label}
        </div>
        
        {editing && !hasImage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div 
              style={{ 
                border: '2px dashed var(--border)', 
                borderRadius: '8px', 
                padding: '1.5rem', 
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(249,115,22,0.05)' }}
              onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onDrop={e => {
                e.preventDefault()
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                handleFileSelect(field, e.dataTransfer.files[0])
              }}
              onClick={() => document.getElementById(`file-input-${field}`).click()}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Arrastra una imagen aquí</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '0.25rem' }}>o haz clic para seleccionar archivo</div>
              <input 
                id={`file-input-${field}`}
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={e => handleFileSelect(field, e.target.files[0])}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.25rem', display: 'block' }}>O pega una URL externa:</label>
              <input
                className="form-input"
                type="url"
                placeholder={placeholder}
                value={form[field]}
                onChange={e => handleChange(field, e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        )}

        {hasImage && (
          <div style={{ position: 'relative', marginTop: (editing && !previews[field] && form[field]) ? '1rem' : 0 }}>
            {editing && (
              <button 
                className="btn btn-red btn-sm"
                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, padding: '4px 8px' }}
                onClick={() => handleClearImage(field)}
              >
                🗑️ Quitar imagen
              </button>
            )}
            <img
              src={currentImageUrl}
              alt={label}
              style={{
                maxWidth: '100%',
                maxHeight: '480px',
                borderRadius: '8px',
                objectFit: 'contain',
                border: '1px solid var(--border)',
                display: 'block',
                margin: '0 auto',
              }}
              onError={e => { e.target.style.display = 'none' }}
            />
            {editing && previews[field] && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent2)', fontWeight: 600 }}>
                ✨ Previsualización local (se subirá al guardar)
              </div>
            )}
          </div>
        )}

        {!editing && !hasImage && (
          <div className="text-muted" style={{ fontStyle: 'italic' }}>Sin imagen. Haz clic en ✏️ Editar para añadir una.</div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--accent)' }}>ℹ️ {tournament.name}</h2>
            <div className="text-muted" style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
              {tournament.venue && <span>📍 {tournament.venue}</span>}
              {tournament.date && <span style={{ marginLeft: '1rem' }}>📅 {tournament.date.includes('-') ? tournament.date.split('-').reverse().join('-') : tournament.date}</span>}
            </div>
            {/* Badges de sumario */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                👥 {totalPlayers} Jugadores inscritos
              </div>
              <div className="badge badge-pending" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                🏀 {totalTeams} Equipos
              </div>
              <div className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                📅 {totalMatches} Partidos generados
              </div>
              <div className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                🏷️ {tournament?.categories?.length || 0} Categorías
              </div>
              <div className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'rgba(100, 116, 139, 0.2)', border: '1px solid rgba(100, 116, 139, 0.4)' }}>
                🏟️ {tournament?.courts?.length || tournament?.numCourts || 1} Pistas
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {editing ? (
              <>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setError(null) }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '💾 Guardando...' : '💾 Guardar cambios'}
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => { setEditing(true); setInfo(null) }}>✏️ Editar información</button>
            )}
          </div>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
        {info && <div className="alert alert-success" style={{ marginTop: '1rem' }}>{info}</div>}
      </div>

      {/* Grid de información */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '0', alignItems: 'start' }}>
        <div style={{ paddingRight: '0.75rem' }}>
          {/* Configuración de Calendario */}
          {renderSection({
            icon: "📋",
            label: "Reglamento y Normas",
            field: "rules",
            placeholder: "Escribe aquí las reglas del torneo: FIBA 3x3, sistema de puntuación, normas de conducta...",
          })}
          {renderSection({
            icon: "📞",
            label: "Datos de Contacto",
            field: "contactInfo",
            placeholder: "Organización: Saski Penguins Basket\nEmail: info@spbasket.es\nTeléfono: +34 600 000 000\nWhatsapp: +34 600 000 000",
          })}
          {renderSection({
            icon: "📍",
            label: "Ubicación y Cómo Llegar",
            field: "locationInfo",
            placeholder: "Dirección del pabellón...\nParking: ...\nTransporte público: Líneas de bus...\nGoogle Maps: https://maps.google.com/...",
          })}
          {renderSection({
            icon: "💡",
            label: "Información de Interés General",
            field: "generalInfo",
            placeholder: "Horario de acreditaciones...\nVestuarios disponibles...\nCafetería abierta de X a Y...\nProtocolo COVID...\nOtra información relevante...",
          })}
        </div>
        <div style={{ paddingLeft: '0.75rem' }}>
          {renderPosterSection({
            icon: "🖼️",
            label: "Cartel del Evento",
            field: "eventPosterUrl",
            placeholder: "https://ejemplo.com/cartel-torneo.jpg"
          })}
          {renderPosterSection({
            icon: "☕",
            label: "Cartel de Cafetería / Menú",
            field: "cafePosterUrl",
            placeholder: "https://ejemplo.com/menu-cafeteria.jpg"
          })}
          {renderPosterSection({
            icon: "🤝",
            label: "Patrocinadores",
            field: "sponsorsImageUrl",
            placeholder: "https://ejemplo.com/patrocinadores-collage.jpg"
          })}
          {renderPosterSection({
            icon: "🏷️",
            label: "Logotipo Cabecera Torneo",
            field: "headerLogoUrl",
            placeholder: "https://ejemplo.com/logo-cabecera-torneo.png"
          })}
          {renderPosterSection({
            icon: "🖼️",
            label: "Logotipo Fondo",
            field: "backgroundLogoUrl",
            placeholder: "https://ejemplo.com/logo-fondo-torneo.png"
          })}
        </div>
      </div>
    </div>
  )
}
