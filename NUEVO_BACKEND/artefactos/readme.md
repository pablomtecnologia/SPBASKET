# Registro de Cambios - App de Marcador Digital 🏀📱

Este documento detalla el proceso de creación e integración de la aplicación para oficiales de mesa y la lógica de activación de torneos y partidos.

## 🚀 Sesión [2026-05-02]
- **Arranque de Entorno**: Backend (Express/Prisma) iniciado en `npm run dev` y Frontend (Vite) iniciado en `npm run dev`. 🚀🏀

## 🚀 Sesión [2026-04-30]

- **Arranque de Entorno**: Backend (Express/Prisma) iniciado y Frontend (Vite) iniciado en `http://localhost:3009/`.
- **Privacidad**: Se ha eliminado la visualización del nombre del oficial de mesa en todas las vistas del portal público (`PublicPortal.jsx`). 🕵️‍♂️🏀
- **Corrección Registro de Actas**: Se ha corregido un error en la pestaña de administración "Registro de Actas" donde se mostraban los IDs internos de los equipos en lugar de sus nombres. Ahora aparece correctamente: "Equipo Local vs Equipo Visitante". 🏀✨

---

## 🚀 Funcionalidades Implementadas

### 1. Infraestructura y Base de Datos (Prisma)
- **Modelos Actualizados**: Se añadieron campos `active` a `Tournament` y `Match`.
- **Nuevo Modelo `Official`**: Para registrar los nombres de los oficiales de mesa (firstName, lastName).
- **Sincronización**: Base de Datos actualizada y cliente Prisma regenerado.

### 2. Backend (API Node.js/Express)
- **Activación de Torneos**: Endpoint para marcar un torneo como activo (solo uno a la vez).
- **Activación de Partidos**: Endpoint para activar un partido por pista (garantizando exclusividad por pista).
- **Gestión de Oficiales**: CRUD completo para el personal de mesa (campos separados para nombre y apellidos para asegurar compatibilidad con la DB).
- **Consultas Activas**: Endpoints específicos para que la App de Marcador obtenga el torneo y partido activo en tiempo real.
- **Auditoría de Actas**: Endpoint de logs mejorado para incluir metadatos de equipos (nombres).

### 3. Panel de Administración (Frontend)
- **Selector de Torneo Activo**: Añadido botón interactivo en la lista de torneos.
- **Activación de Partidos**: Nuevo interruptor visual en el Calendario para mandar partidos al marcador digital.
- **Mantenimiento de Oficiales**: Nueva pestaña "Oficiales" para dar de alta/baja al personal.
- **Registro de Actas**: Nueva sección para auditar cada acción realizada por los oficiales en un partido.

### 4. App de Marcador Digital (`/marcador`)
- **Portal de Selección**: Interfaz para elegir Oficial y Pista.
- **Acta Digital Interactiva** (`/marcador/acta/...`): 
  - Se abre en una **nueva ventana** al seleccionar la pista.
  - **Misma Apariencia que el Acta Impresa**: Colores de categoría, grid de tanteo (1-21), campos de equipos, hora y número de partido.
  - **Control Táctil**: Al pulsar sobre los números del "Tanteo" se actualiza el marcador en tiempo real.
  - **Observaciones**: Campo de texto para registrar incidencias directamente en el acta digital.
  - **Sincronización**: Estado visual de guardado (⏳ Guardando / ✅ Sincronizado).

---

## 🛠️ Instrucciones de Uso
1. **Activar Torneo**: En el panel de administración, marcar el torneo deseado como 🟢 **ACTIVO**.
2. **Registrar Oficiales**: En la pestaña "Oficiales", añadir los nombres de los oficiales.
3. **Activar Partido**: En el Calendario, pulsar el icono ⚪/🟢 para enviar el partido a una pista.
4. **Abrir Marcador**: Acceder a `URL/marcador` desde el dispositivo móvil.
5. **Gestionar**: Seleccionar Oficial, Pista y ¡empezar a anotar! 🏀✨
