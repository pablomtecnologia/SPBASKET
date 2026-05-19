### Resumen de Cambios - Fix Acceso Oficiales 🛠️

Se ha resuelto la incidencia por la cual la aplicación de marcadores para oficiales indicaba que el torneo no estaba activo a pesar de estarlo.

#### Cambios Realizados:

1.  **DigitalScoreboard.jsx**:
    *   **Corrección de Carga de Datos**: Se ha modificado la función `loadInitialData` para que sea secuencial. Primero obtiene el torneo activo mediante `api.getActiveTournament()` y, una vez obtenido el ID, solicita los oficiales con `api.getOfficials(tournament.id)`. Anteriormente se usaba un `Promise.all` donde la llamada a oficiales fallaba por falta de ID.
    *   **Mejora de UI de Error**: Se ha implementado una pantalla de error específica con botón de **"🔄 Reintentar"** para los oficiales. Ahora, si hay un fallo de red o de API, se muestra un mensaje claro en lugar de simplemente decir que no hay torneo activo.
    *   **Estado Inactivo**: Se ha añadido un botón de **"🔄 Comprobar de nuevo"** en la pantalla de "No hay torneo activo" para facilitar la actualización manual sin recargar toda la página.

2.  **api.js** (Verificación):
    *   Se confirmó que `api.getActiveTournament()` tiene los headers adecuados para evitar cacheos indeseados.

#### Próximos Pasos:
*   El usuario puede verificar ahora el acceso desde la ruta de oficiales.
*   Si persiste algún problema, el nuevo botón de error proporcionará más detalles técnicos.

---
*Documentación generada por Antigravity* 🚀
