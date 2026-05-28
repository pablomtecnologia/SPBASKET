# 🤖 SISTEMA DE SCRAPING AUTOMÁTICO FECAN

## 📋 Descripción

Sistema completamente automático que **consulta la página de FECAN cada 2 horas** y actualiza automáticamente los partidos de tus equipos (SP ROSA y SP NEGRO) en la base de datos.

## ✨ Características

- ✅ **Consulta automática cada 2 horas** (00:00, 02:00, 04:00, etc.)
- ✅ **Importación al arrancar el servidor** (primera vez)
- ✅ **API endpoints** para control manual
- ✅ **Vista previa** antes de importar
- ✅ **Logs de importación** para auditoría
- ✅ **Actualización inteligente** (no duplica partidos)
- ✅ **Gestión de errores** robusta

## 🚀 Cómo Funciona

### 1. Automático (cada 2 horas)

El sistema se ejecuta **automáticamente** cada 2 horas sin intervención:

```
00:00 → Importa partidos de FECAN
02:00 → Importa partidos de FECAN
04:00 → Importa partidos de FECAN
...y así sucesivamente
```

**No tienes que hacer nada**, simplemente arranca el servidor y funcionará solo.

### 2. Manual (API Endpoints)

También puedes ejecutar manualmente o ver datos:

#### 🔍 Vista Previa (Sin guardar)
```http
GET /api/admin/fecan/matches/sp-rosa
GET /api/admin/fecan/matches/sp-negro
```
**Requiere**: Token de administrador
**Devuelve**: Vista previa de partidos sin guardar en BD

#### 📥 Importar Ahora (Guardar en BD)
```http
POST /api/admin/fecan/import/sp-rosa
POST /api/admin/fecan/import/sp-negro
```
**Requiere**: Token de administrador
**Acción**: Descarga y guarda partidos en la base de datos

#### 🚀 Ejecutar Importación Completa
```http
POST /api/admin/fecan/run-now
```
**Requiere**: Token de administrador
**Acción**: Ejecuta importación para TODOS los equipos configurados

#### 👀 Ver Partidos Guardados (Público)
```http
GET /api/fecan/matches/sp-rosa
GET /api/fecan/matches/sp-negro
```
**Requiere**: No requiere autenticación
**Devuelve**: Partidos guardados en la base de datos

#### 📝 Ver Logs de Importación
```http
GET /api/admin/fecan/logs
```
**Requiere**: Token de administrador
**Devuelve**: Últimas 20 importaciones con resultados

## 📂 Archivos Creados

### Backend (Nuevos archivos)

```
backend/
├── fecan-auto-scraper.js          ← Servicio automático principal
├── init-fecan-tables.js           ← Inicialización de tablas DB
├── test-auto-scraper.js           ← Script de prueba
└── scraper-fecan.js               ← Ya existía (mejorado)
```

### Modificaciones en Archivos Existentes

```
backend/
├── server.js                      ← Añadidos endpoints API + cron job
└── package.json                   ← Añadida dependencia node-cron
```

## 🗄️ Base de Datos

### Tabla: `fecan_matches`

Almacena todos los partidos importados:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | ID único |
| team_id | VARCHAR(50) | 'sp-rosa' o 'sp-negro' |
| round | INTEGER | Número de jornada |
| match_date | VARCHAR(20) | Fecha del partido |
| match_time | VARCHAR(10) | Hora del partido |
| home_team | VARCHAR(100) | Equipo local |
| away_team | VARCHAR(100) | Equipo visitante |
| location | VARCHAR(200) | Pabellón |
| home_score | INTEGER | Resultado local |
| away_score | INTEGER | Resultado visitante |
| status | VARCHAR(20) | 'played' o 'upcoming' |
| last_updated | TIMESTAMP | Última actualización |

**Restricción**: `UNIQUE(team_id, round)` → No puede haber duplicados

### Tabla: `fecan_import_logs`

Registra todas las importaciones:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | ID único |
| import_date | TIMESTAMP | Fecha de importación |
| results | JSONB | Resultados detallados |
| status | VARCHAR(20) | Estado de la importación |
| error_message | TEXT | Mensaje de error (si hubo) |

## 🛠️ Instalación y Uso

### 1. Instalar Dependencias

```bash
cd backend
npm install node-cron
```

✅ **YA HECHO** - node-cron ya está instalado

### 2. Inicializar Tablas

```bash
node init-fecan-tables.js
```

✅ **YA HECHO** - Las tablas ya están creadas

### 3. Probar el Scraper (Opcional)

```bash
node test-auto-scraper.js
```

Esto ejecutará una importación de prueba y mostrará los resultados.

### 4. Arrancar el Servidor

```bash
node server.js
```

**El servidor automáticamente**:
- ⏰ Configurará el cron job (cada 2 horas)
- 🚀 Ejecutará una importación inicial después de 5 segundos
- 🔄 Importará automáticamente cada 2 horas

## 📊 Logs y Monitoreo

### Logs en Consola

Cuando el servidor está corriendo, verás:

```
🤖 Cron job de FECAN configurado: cada 2 horas
🚀 Ejecutando importación inicial de FECAN al arrancar servidor...

╔═══════════════════════════════════════════════════════╗
║  🤖 IMPORTACIÓN AUTOMÁTICA FECAN                     ║
╚═══════════════════════════════════════════════════════╝
⏰ Fecha: 07/02/2026, 01:32:18

🔄 Importando partidos para SP ROSA (ID FECAN: 4046)...
📊 Encontrados 15 partidos para SP ROSA
✅ SP ROSA: 3 nuevos, 12 actualizados, 0 errores

🔄 Importando partidos para SP NEGRO (ID FECAN: 4046)...
📊 Encontrados 15 partidos para SP NEGRO
✅ SP NEGRO: 2 nuevos, 13 actualizados, 0 errores

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESUMEN DE IMPORTACIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SP ROSA: 3 nuevos, 12 actualizados (Total: 15)
✅ SP NEGRO: 2 nuevos, 13 actualizados (Total: 15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Próxima Ejecución Automática

Las próximas importaciones automáticas se ejecutarán a:
- 00:00, 02:00, 04:00, 06:00, 08:00, 10:00
- 12:00, 14:00, 16:00, 18:00, 20:00, 22:00

**Siempre en hora del sistema** (timezone: Europe/Madrid)

## ⚙️ Configuración

### Cambiar Equipos

Edita `backend/fecan-auto-scraper.js`:

```javascript
const TEAMS_CONFIG = {
    'sp-rosa': {
        fecanId: 4046,        // ← ID en la página de FECAN
        name: 'SP ROSA',
        enabled: true         // ← true para activar, false para desactivar
    },
    'sp-negro': {
        fecanId: 4046,
        name: 'SP NEGRO',
        enabled: true
    }
};
```

### Cambiar Frecuencia

Edita `backend/server.js`, línea del cron:

```javascript
// Cada 2 horas (actual)
cron.schedule('0 */2 * * *', async () => { ... });

// Cada 1 hora
cron.schedule('0 */1 * * *', async () => { ... });

// Cada 3 horas
cron.schedule('0 */3 * * *', async () => { ... });

// Todos los días a las 9:00 AM
cron.schedule('0 9 * * *', async () => { ... });

// Cada lunes a las 10:00 AM
cron.schedule('0 10 * * 1', async () => { ... });
```

### Desactivar Importación Inicial

Si NO quieres que importe al arrancar el servidor, comenta estas líneas en `server.js`:

```javascript
// Comentar desde aquí ↓
// setTimeout(async () => {
//     console.log('🚀 Ejecutando importación inicial...');
//     try {
//         await runAutoImport(pool);
//     } catch (error) {
//         console.error('⚠️ Error:', error);
//     }
// }, 5000);
// Hasta aquí ↑
```

## 🧪 Pruebas

### Probar Scraper Manualmente

```bash
cd backend
node test-auto-scraper.js
```

### Probar Scraper Individual

```bash
cd backend
node test-fecan-scraper.js
```

### Probar Import Manual (con cURL)

```bash
# Con token de administrador
curl -X POST http://localhost:80/api/admin/fecan/run-now \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🐛 Solución de Problemas

### El scraper no se ejecuta automáticamente

1. **Verifica que el servidor esté corriendo**:
   ```bash
   node server.js
   ```

2. **Busca en los logs**:
   ```
   🤖 Cron job de FECAN configurado: cada 2 horas
   ```

3. **Espera 2 horas** o ejecuta manualmente:
   ```bash
   curl -X POST http://localhost:80/api/admin/fecan/run-now
   ```

### No se encuentran partidos

1. **Verifica la URL de FECAN**:
   - https://www.fecanbaloncesto.com/equipo/?id=4046

2. **Prueba el scraper directo**:
   ```bash
   node test-fecan-scraper.js
   ```

3. **Revisa los logs** en consola para ver errores específicos

### Error de conexión a base de datos

1. **Verifica PostgreSQL** está corriendo:
   ```bash
   # En tu servidor local
   psql -U spbasket_user -d spbasket
   ```

2. **Verifica credenciales** en `.env`:
   ```
   DATABASE_URL=postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket
   ```

## 📈 Próximas Mejoras (Opcional)

- [ ] Notificaciones por email cuando hay nuevos resultados
- [ ] Dashboard de importaciones en el frontend
- [ ] Alertas si una importación falla
- [ ] Estadísticas de partidos importados
- [ ] Scraping de clasificaciones de liga

## 📝 Notas Importantes

- ✅ **El sistema ya está listo** para usar en local
- ✅ **Funcionará automáticamente** al arrancar el servidor
- ✅ **No requiere intervención** manual después de configurado
- ⚠️ Asegúrate de que PostgreSQL esté corriendo
- ⚠️ Verifica que la URL de FECAN sea correcta
- 💡 Los logs te mostrarán exactamente qué está pasando

## 🚀 Despliegue al Servidor

Cuando esté todo funcionando en local:

1. **Haz commit** de los cambios:
   ```bash
   git add .
   git commit -m "Scraping automático FECAN cada 2 horas"
   ```

2. **Despliega** al servidor:
   ```bash
   deploy_now.bat
   ```

3. **En el servidor**, asegúrate de:
   - PostgreSQL está corriendo
   - Las tablas están inicializadas
   - El servidor Node está corriendo continuamente (PM2 o similar)

---

**¡Sistema listo para funcionar!** 🎉

Cualquier duda, revisa los logs en consola o ejecuta las pruebas.
