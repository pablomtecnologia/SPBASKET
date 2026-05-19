# Manual de Instalación - SPBASKET 3x3

Este documento describe la instalación y puesta en marcha del sistema **SPBASKET 3x3** en entorno local. También recoge recomendaciones prácticas de operación y mantenimiento para la versión actual del proyecto.

---

## 1. Requisitos previos

Antes de comenzar, asegúrate de disponer de:
- `Node.js` 18 o superior
- `npm`
- `Git` opcionalmente, si vas a clonar el repositorio
- Windows, Linux o macOS con permisos para abrir puertos locales

Tecnologías principales del proyecto:
- Backend: `Express + Prisma + SQLite`
- Frontend: `React + Vite`

---

## 2. Estructura del proyecto

El repositorio está dividido en dos aplicaciones:
- `backend/`: API, base de datos, lógica de competición y programación
- `frontend/`: interfaz de administración, portal público, monitor y acta digital

Archivos y carpetas relevantes:
- `backend/prisma/schema.prisma`
- `backend/prisma/dev.db`
- `backend/src/index.js`
- `backend/src/services/scheduler.js`
- `frontend/src/`
- `artefactos/`

---

## 3. Instalación del backend

### 3.1 Entrar en la carpeta
```powershell
cd backend
```

### 3.2 Instalar dependencias
```powershell
npm install
```

### 3.3 Inicializar y sincronizar base de datos
```powershell
npx prisma db push
```

Este comando:
- crea `prisma/dev.db` si no existe
- sincroniza el esquema actual con SQLite
- actualiza el cliente Prisma

Si el esquema cambia:
- vuelve a ejecutar `npx prisma db push`
- reinicia el backend después para asegurar que cargue el cliente Prisma actualizado

### 3.4 Iniciar el backend
```powershell
npm run dev
```

El backend quedará disponible en:
- `http://localhost:3001`

---

## 4. Instalación del frontend

### 4.1 Entrar en la carpeta
```powershell
cd frontend
```

### 4.2 Instalar dependencias
```powershell
npm install
```

### 4.3 Iniciar el frontend
```powershell
npm run dev
```

La aplicación quedará disponible en:
- `http://localhost:3009`

El frontend usa puerto fijo `3009`.

---

## 5. URLs del sistema

Con backend y frontend arrancados, las rutas principales son:

| Servicio | URL |
| :--- | :--- |
| Frontend principal | `http://localhost:3009` |
| Administración | `http://localhost:3009/gestion-privada-penguin` |
| Portal público | `http://localhost:3009/public/:id` |
| Monitor TV | `http://localhost:3009/live/:id` |
| Acta digital | `http://localhost:3009/marcador/acta/:id/:pista` |
| Backend API | `http://localhost:3001` |

---

## 6. Acceso desde otros dispositivos de la red

Para tablets de oficiales, televisores o móviles conectados a la misma Wi-Fi:

### 6.1 Obtener la IP local del equipo servidor
En Windows:
```powershell
ipconfig
```

Busca la dirección IPv4, por ejemplo:
- `192.168.1.15`

### 6.2 Acceder desde la red local
Ejemplos:
- `http://192.168.1.15:3009/public/5`
- `http://192.168.1.15:3009/live/5`
- `http://192.168.1.15:3009/marcador/acta/5/Pista%201`

---

## 7. Publicación externa temporal

Si necesitas compartir el portal público fuera de la red local, puedes usar una herramienta de túnel como `localtunnel`.

Ejemplo:
```powershell
npx localtunnel --port 3009
```

Esto generará una URL pública temporal para compartir.

---

## 8. Build de producción

Si deseas compilar el frontend:

```powershell
cd frontend
npm run build
```

El resultado se generará en:
- `frontend/dist`

Después podrás servir esos archivos desde el backend o desde un servidor web externo, según la estrategia de despliegue elegida.

---

## 9. Funcionalidades actuales a tener en cuenta en la instalación

La instalación actual debe contemplar que el sistema incluye:
- administración completa de torneos
- clonación de torneos
- gestión de categorías, equipos, jugadores y oficiales
- lógica parametrizable de grupos y eliminatorias
- partido de 3º y 4º puesto
- calendario con edición manual
- cronómetro global
- acta digital
- monitor TV
- portal público reactivo
- imágenes de patrocinadores y material visual del torneo

Por tanto, es recomendable probar tras la instalación:
- acceso a administración
- generación de un torneo de prueba
- creación de jornadas y pistas
- generación de calendario
- apertura del monitor
- acceso al portal público
- acceso al acta digital desde otro dispositivo

---

## 10. Mantenimiento operativo

### 10.1 Cambios en Prisma
Cuando cambie el modelo de datos:
1. ejecuta `npx prisma db push`
2. reinicia el backend

### 10.2 Cambios en jornadas, pistas o descansos
Si modificas:
- franjas horarias
- pistas abiertas/cerradas
- categorías por pista
- rondas de descanso

los partidos ya programados no se recolocan automáticamente. Debes:
1. borrar el calendario actual
2. regenerar el calendario

### 10.3 Reinicio recomendado
Si notas comportamientos extraños tras cambios de esquema o de código:
- reinicia backend
- reinicia frontend

---

## 11. Resolución de problemas

### 11.1 Error de base de datos
- Ejecuta:
```powershell
npx prisma db push
```
- Después reinicia el backend.

### 11.2 El frontend no arranca en `3009`
- Revisa si el puerto está ocupado.
- El frontend está configurado para usar puerto fijo.

### 11.3 El backend no arranca en `3001`
- Verifica si otro proceso está ocupando el puerto.
- Reinicia el servicio o mata el proceso conflictivo.

### 11.4 Un cambio nuevo no se refleja
Comprueba:
- que el backend se ha reiniciado
- que el frontend se ha recargado
- que Prisma está sincronizado

### 11.5 El calendario no cambia tras editar jornadas
Eso es comportamiento esperado si ya existían slots generados. Debes borrar y regenerar el calendario.

### 11.6 Portal o monitor no accesibles desde tablets
Revisa:
- que el dispositivo está en la misma red
- que usas la IP local correcta
- que el firewall permite conexiones entrantes al puerto `3009`

---

## 12. Recomendación de despliegue para torneo presencial

Para una operativa estable en jornada real:
- un PC principal como servidor local
- navegador abierto con administración
- una TV o monitor para `live/:id`
- una tablet o móvil por pista para `marcador/acta/:id/:pista`
- revisión previa de Wi-Fi y puertos

---

## 13. Comprobación final

Una instalación se considera correcta si puedes:
1. abrir la administración
2. crear o clonar un torneo
3. crear jornadas
4. configurar pistas
5. generar partidos
6. generar calendario
7. abrir monitor, portal público y acta digital

---

> Recomendación: antes de una jornada real, crea un torneo de prueba y recorre el flujo completo para validar red local, tablets, monitor y generación automática del calendario.
