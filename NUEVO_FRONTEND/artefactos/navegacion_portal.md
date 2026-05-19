# Navegación Inteligente del Portal 🏠🚀

Se ha mejorado la experiencia de usuario en el panel de administración al interactuar con el portal público.

## Cambios Implementados 🛠️

### Botón "Ir al Portal"
El botón situado en la barra de navegación superior ahora tiene un comportamiento dinámico y mejorado:

1.  **Sin Torneo Seleccionado:**
    *   **Acción:** Abre la raíz del sitio (`/`).
    *   **Resultado:** Muestra la pantalla de selección de torneos.

2.  **Con Torneo Seleccionado:**
    *   **Acción:** Abre `/public/${tournamentId}`.
    *   **Resultado:** Muestra directamente el portal público del torneo actual.

3.  **Apertura en Nueva Pestaña (Update):**
    *   **Comportamiento:** Ahora siempre utiliza `window.open(url, '_blank')`.
    *   **Ventaja:** Permite al administrador mantener el panel de control abierto mientras visualiza el portal público simultáneamente. 🌐✨

## Archivos Modificados 📄
- `frontend/src/AdminAppNew.jsx`: Actualización de la lógica del manejador `onClick` para soportar apertura en nueva pestaña.

---
*Generado por Antigravity el 2026-04-29* 🤖
