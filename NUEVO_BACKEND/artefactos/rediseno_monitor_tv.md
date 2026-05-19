# Rediseño del Monitor en Vivo (Live Monitor) 📺🏀

Se ha transformado la visualización del monitor del pabellón para ofrecer una experiencia más profesional y fácil de seguir para jugadores y espectadores.

## 🛠️ Cambios Realizados

### 1. Lógica de Agrupación por Rondas 📅🕒
- Los partidos ya no aparecen como una lista plana, sino agrupados por sus franjas horarias (rondas).
- Cada bloque muestra una cabecera clara con el día y la hora de inicio.

### 2. Organización Dinámica de Columnas 🔄
- **Columna Izquierda (En Juego)**: 
  - Muestra exclusivamente las rondas que contienen al menos un partido **ACTIVO** o **EN CURSO**.
  - Incluye todos los partidos de esa franja horaria (aunque no hayan empezado) para dar una visión completa de la ronda actual.
- **Columna Derecha (Próximos)**: 
  - Muestra las **dos siguientes rondas** programadas que no están en la columna izquierda.
  - Permite a los equipos de las siguientes franjas localizar su pista con antelación.

### 3. Identidad Visual y Colores 🎨
- **Fronteras Dinámicas**: Cada tarjeta de partido utiliza el color oficial de su categoría para el borde izquierdo.
- **Badges de Categoría**: Se ha aplicado un fondo suave basado en el color de la categoría para mejorar la legibilidad.
- **Formato de Texto**: Ahora se muestra `Categoría (Tipo)` (ej. "U16 Femenino (Grupo)").
- **Efectos Activos**: Los partidos en curso tienen un efecto de resplandor (*glow*) pulsante en el borde, facilitando su identificación rápida.

### 4. Documentación 📝
- Actualización de `README.md` con las nuevas capacidades del monitor.
- Registro del **Prompt 18** en `prompts/prompts.md`.

## 🚀 Impacto en el Usuario
El monitor ahora actúa como un verdadero centro de mando visual en el pabellón, permitiendo a cualquier persona entender en qué punto se encuentra el torneo simplemente echando un vistazo rápido a la pantalla.

---
*Rediseño del monitor completado con éxito.* 📺🏀🚀
