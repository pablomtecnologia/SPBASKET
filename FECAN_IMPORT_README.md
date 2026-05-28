# 🔄 Sistema de Importación Automática FECAN

## Descripción

Este sistema permite importar automáticamente los resultados y partidos futuros desde la página oficial de la Federación Cántabra de Baloncesto (FECAN) directamente a tu sitio web de SP Basket.

## Características

- ✅ Importación automática de calendarios de partidos
- ✅ Actualización automática de resultados
- ✅ Vista previa antes de importar
- ✅ Detección automática de partidos jugados y futuros
- ✅ Importación de logos de equipos
- ✅ Sincronización con la base de datos
- ✅ Solo accesible para administradores

## Cómo Usar

### 1. Acceder al Panel de Importación

1. Inicia sesión como **administrador**
2. Ve al menú superior y haz clic en **"🔄 IMPORTAR FECAN"**
3. Se abrirá el panel de importación

### 2. Vista Previa

Antes de importar, puedes ver una vista previa de los datos:

1. Haz clic en **"👁️ Vista Previa"** en la tarjeta del equipo (SP ROSA o SP NEGRO)
2. El sistema mostrará:
   - Número de partidos encontrados
   - Muestra de los primeros 5 partidos
   - Información de cada partido (jornada, equipos, fecha, resultado)

### 3. Importar Partidos

Una vez verificada la vista previa:

1. Haz clic en **"📥 Importar Ahora"**
2. El sistema:
   - Descargará todos los partidos desde FECAN
   - Los guardará en la base de datos
   - Actualizará automáticamente los que ya existen
   - Mostrará un resumen:
     - **Nuevos**: Partidos que no existían
     - **Actualizados**: Partidos que se actualizaron
     - **Total**: Total de partidos procesados

### 4. Ver Resultados en la Web

Los partidos importados se mostrarán automáticamente en:

- **Página de Competiciones**: `/competiciones`
- **Detalle de SP ROSA**: `/competiciones/sp-rosa`
- **Detalle de SP NEGRO**: `/competiciones/sp-negro`

## Configuración Técnica

### IDs de Equipos en FECAN

- **SP ROSA**: ID 4046
- **SP NEGRO**: ID 4046 (mismo club, diferentes equipos)

### Endpoints API

#### Vista Previa (GET)
```
GET /api/admin/fecan/matches/:teamId
```
- **teamId**: `sp-rosa` o `sp-negro`
- **Autenticación**: Token de administrador requerido
- **Respuesta**: Array de partidos sin guardar en BD

#### Importar (POST)
```
POST /api/admin/fecan/import/:teamId
```
- **teamId**: `sp-rosa` o `sp-negro`
- **Autenticación**: Token de administrador requerido
- **Respuesta**: Estadísticas de importación (nuevos, actualizados, errores)

#### Obtener Partidos Guardados (GET)
```
GET /api/fecan/matches/:teamId
```
- **teamId**: `sp-rosa` o `sp-negro`
- **Autenticación**: No requerida (público)
- **Respuesta**: Array de partidos guardados en BD

### Estructura de Datos

Cada partido importado contiene:

```typescript
{
  id: number,              // ID en base de datos
  team_id: string,         // 'sp-rosa' o 'sp-negro'
  round: number,           // Jornada (1, 2, 3, ...)
  match_date: string,      // Fecha (DD/MM/YYYY)
  match_time: string,      // Hora (HH:MM)
  home_team: string,       // Equipo local
  away_team: string,       // Equipo visitante
  location: string,        // Pabellón
  home_score: number,      // Resultado local (null si no jugado)
  away_score: number,      // Resultado visitante (null si no jugado)
  home_team_logo: string,  // URL logo equipo local
  away_team_logo: string,  // URL logo equipo visitante
  status: string,          // 'played' o 'upcoming'
  last_updated: timestamp  // Última actualización
}
```

## Métodos de Importación

El sistema utiliza dos métodos para obtener los datos:

### 1. API JSON (Preferido)
- Más rápido y confiable
- Usa el endpoint JSON de OptimalWay (sistema de FECAN)
- URL: `https://d206q8529sjqpk.cloudfront.net/recursos/equips/{id}/calendari.json`

### 2. Scraping HTML (Fallback)
- Se usa si la API no está disponible
- Parsea el HTML de la página de equipo
- URL: `https://www.fecanbaloncesto.com/equipo/?id={id}`

## Mantenimiento

### Frecuencia Recomendada

- **Durante la temporada**: Importar después de cada jornada (1-2 veces por semana)
- **Actualización de resultados**: Lunes después de cada jornada
- **Fuera de temporada**: 1 vez al mes para verificar calendario

### Actualización Automática vs Manual

**Actual**: Manual (requiere que un administrador haga clic en "Importar Ahora")

**Futuro** (opcional): Se puede programar una tarea automática:
```javascript
// En server.js, agregar:
const cron = require('node-cron');

// Ejecutar todos los lunes a las 9:00 AM
cron.schedule('0 9 * * 1', async () => {
  console.log('🔄 Importación automática FECAN');
  // Aquí llamar a la función de importación
});
```

## Resolución de Problemas

### Error: "No se encontraron partidos"
- **Causa**: La página de FECAN podría estar caída o cambiaron la estructura
- **Solución**: Intenta de nuevo más tarde o contacta al desarrollador

### Error: "Token inválido"
- **Causa**: La sesión expiró
- **Solución**: Cierra sesión y vuelve a iniciar sesión

### Los logos no se muestran
- **Causa**: URLs de logos incorrectas o no disponibles
- **Solución**: El sistema usa logos por defecto automáticamente

### Partidos duplicados
- **No puede ocurrir**: El sistema usa `UNIQUE(team_id, round)` en la BD
- Los partidos con misma jornada se actualizan automáticamente

## Seguridad

- ✅ Solo administradores pueden importar
- ✅ Validación de tokens JWT
- ✅ Rate limiting en API
- ✅ Sanitización de datos importados
- ✅ Logs de todas las importaciones

## Soporte

Para problemas o preguntas:
1. Verifica los logs del servidor (console)
2. Revisa el panel de importación para mensajes de error
3. Contacta al desarrollador si el problema persiste

## Archivos Relacionados

### Backend
- `/backend/scraper-fecan.js` - Lógica de scraping
- `/backend/server.js` - Endpoints API (líneas 1358+)

### Frontend
- `/src/app/pages/admin-fecan-import/` - Componente de importación
- `/src/app/services/fecan.service.ts` - Servicio de datos
- `/src/app/pages/competicion-detalle/` - Visualización de partidos

### Base de Datos
- Tabla: `fecan_matches`
- Constraint: `UNIQUE(team_id, round)`

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Desarrollado para**: SP Basket / Saski Penguins
