# 🏀 Guía de Despliegue e Integración — Torneo 3x3 (SP Basket)

Esta guía detalla el trabajo de integración y despliegue realizado para el portal del **Torneo 3x3**, diseñado originalmente por **Jon Amayuelas Celaya (2026)**, y adaptado de forma independiente en tu servidor VPS de Saski Penguins sin alterar ni interferir en la web principal.

---

## 🛠️ Lo que hemos hecho (Resumen de Cambios)

### 1. 📂 Independencia del Backend (Puerto 3002 + SSL Seguro)
* El backend de producción actual corre en el puerto **`3001`**. Hemos configurado este nuevo backend para correr de forma aislada en el puerto **`3002`** (gestionado por **PM2** con el nombre `spbasket-3x3`).
* Para evitar problemas de "Contenido Mixto" (Mixed Content) y usar el certificado SSL HTTPS existente, añadimos una regla elegante en el proxy Nginx del VPS:
  * Las llamadas a `https://saskipenguins.com/api-3x3/` son redirigidas internamente a `http://localhost:3002/api/`.

### 2. 🖼️ Solución para Logos e Imágenes Dinámicas (Enlaces Rotos)
* **Servidor (Backend):** 
  * Modificamos [index.js](NUEVO_BACKEND/backend/src/index.js) para servir el directorio `uploads` también en `/api/uploads`. De este modo, Nginx puede proxyar las imágenes subidas de manera dinámica en la ruta `/api-3x3/uploads/...`.
  * Añadimos una validación al arrancar el backend para verificar y crear automáticamente la carpeta `/uploads` si no existe, previniendo errores al subir archivos.
* **Cliente (Frontend):**
  * Creamos la función `resolveImageUrl` en [tournamentBranding.js](NUEVO_FRONTEND/frontend/src/utils/tournamentBranding.js). Si detecta que una ruta es relativa (comienza por `/uploads/`), le añade automáticamente el endpoint seguro HTTPS de producción (`https://saskipenguins.com/api-3x3`).
  * Aplicamos esta resolución en [PublicPortal.jsx](NUEVO_FRONTEND/frontend/src/components/PublicPortal.jsx) (carteles de evento, cafetería, patrocinadores) y [TournamentInfo.jsx](NUEVO_FRONTEND/frontend/src/components/TournamentInfo.jsx) (panel de administración).
  * Los logotipos (cabecera y fondo) ahora cargan de manera idónea si hay logos personalizados, o alternan automáticamente al logo del torneo por defecto en `/3x3/logo.png`.
* **Corregido endpoint de guardado:** 
  * Corregimos un error en el panel de administración ([TournamentInfo.jsx](NUEVO_FRONTEND/frontend/src/components/TournamentInfo.jsx)) que hacía llamadas directas de `fetch` a `/api/tournaments` (apuntando por error al backend principal del puerto `3001`). Ahora utiliza de manera correcta el cliente API de la aplicación.

---

## 🚀 Cómo Desplegar Cambios en el Futuro (Scripts de Automatización)

Para que tanto tú como Jon puedan actualizar la aplicación en el futuro sin complicaciones, hemos dejado listos dos scripts automatizados en la carpeta [scratch/deploy/](scratch/deploy):

### A) Desplegar el Frontend 💻
El frontend está alojado en el VPS en la ruta `/var/www/html/3x3` y se compila usando un subdirectorio (`base: '/3x3/'`).
1. Compila la aplicación localmente en la carpeta `NUEVO_FRONTEND/frontend`:
   ```bash
   cd NUEVO_FRONTEND/frontend
   npm run build
   ```
2. Ejecuta el script de subida automática (vía SFTP al VPS):
   ```bash
   cd ../../scratch/deploy
   node deploy_vps_frontend.js
   ```
   *Este script limpiará la carpeta anterior en el servidor de forma segura y subirá la nueva compilación.*

### B) Desplegar el Backend ⚙️
Si realizas modificaciones en el código del backend local:
1. Ejecuta el script de subida automática del backend:
   ```bash
   cd scratch/deploy
   node deploy_vps_backend.js
   ```
   *Este script se conecta de forma segura vía SFTP para reemplazar el archivo de control `index.js` en el VPS, se conecta vía SSH y le ordena a PM2 un reinicio seguro en caliente (`pm2 restart spbasket-3x3`).*

---

## 📂 Directorios Desplegados en el VPS

* **Frontend:** `/var/www/html/3x3/` (servido por Nginx).
* **Backend:** `/var/www/spbasket-3x3/backend/` (proceso Node corriendo en el puerto 3002).
* **Base de Datos:** `/var/www/spbasket-3x3/backend/prisma/dev.db` (SQLite local).

---

## 🏁 Enlaces en Producción para Verificar
* 🌐 **Portal Público del Torneo:** [https://saskipenguins.com/3x3](https://saskipenguins.com/3x3)
* ⚙️ **Panel de Administración (Admin):** [https://saskipenguins.com/3x3/admin](https://saskipenguins.com/3x3/admin)
* 📡 **Healthcheck Backend (Seguro HTTPS):** [https://saskipenguins.com/api-3x3/health](https://saskipenguins.com/api-3x3/health)

---
*Gestión e integración completada en Mayo de 2026. ¡Todo listo y 100% operativo!*
