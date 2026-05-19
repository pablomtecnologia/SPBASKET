import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("💥 [ErrorBoundary] Error capturado:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ margin: '2rem', border: '2px solid var(--red)', background: 'rgba(239,68,68,0.1)' }}>
          <div className="card-title" style={{ color: 'var(--red)' }}>⚠️ Algo ha salido mal</div>
          <p>Se ha producido un error al cargar esta sección. Por favor, intenta recargar la página o selecciona otro torneo.</p>
          <pre style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: '8px', 
            fontSize: '0.75rem',
            overflowX: 'auto',
            color: '#fca5a5'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            className="btn btn-primary mt-2" 
            onClick={() => window.location.reload()}
          >
            🔄 Recargar Aplicación
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
