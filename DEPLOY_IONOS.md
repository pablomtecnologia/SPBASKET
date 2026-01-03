# Guía de Despliegue en IONOS e Información Importante

Este documento detalla cómo poner tu web en producción utilizando el hosting "Espacio web" de IONOS que tienes contratado.

## ⚠️ Información CRÍTICA sobre tu Hosting

Tu plan actual en IONOS es un **"Espacio web"** (Web Hosting compartido). Este tipo de hosting tiene limitaciones importantes:

1.  **Backend (Node.js)**: Los planes de hosting compartido estándar (como el que muestra tu captura) **NO soportan** la ejecución de servidores Node.js persistentes (como `npm start` para tu backend con Express). Están diseñados principalmente para PHP y archivos estáticos (HTML/CSS/JS).
2.  **Frontend (Angular)**: FUNCIONARÁ PERFECTAMENTE. La parte visual de tu web son archivos estáticos que este hosting sirve sin problemas.

### ¿Qué opciones tienes para el Backend?

1.  **Opción Recomendada (Híbrida)**:
    *   **Frontend**: Alojado en IONOS (como explicaremos abajo).
    *   **Backend**: Usar un servicio gratuito/barato especializado en Node.js como **Render.com**, **Railway**, o **Vercel** (donde ya lo tenías).
    *   **Base de Datos**: Puedes usar la MySQL de IONOS, pero tendrás que permitir conexiones externas (algo que a veces los hostings compartidos bloquean) o usar una base de datos en la nube (como en Railway o CockroachDB free tier).

2.  **Opción "Solo Frontend"**:
    *   Subir solo la web a IONOS y dejar el backend corriendo en tu PC (usando ngrok/túneles), pero esto solo funcionará cuando tu PC esté encendido.

---

## 🚀 PASO 1: Preparar (Compilar) el Frontend

Antes de subir nada, necesitamos convertir tu código Angular en archivos web estándar.

1.  Abre una terminal en la carpeta `sp-basket`.
2.  Ejecuta el siguiente comando para construir la versión de producción:
    ```bash
    ng build --configuration production
    ```
    *Esto creará una carpeta `dist/sp-basket/browser` con tus archivos (index.html, .js, .css).*

3.  **Configuración para el Router de Angular en IONOS**:
    Para que las rutas (como `/productos`, `/noticias`) funcionen al recargar la página, necesitas un archivo especial.
    *   Crea un archivo llamado `.htaccess` dentro de la carpeta `dist/sp-basket/browser` (o créalo en tu PC y súbelo luego) con este contenido:

    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule . /index.html [L]
    </IfModule>
    ```

---

## ☁️ PASO 2: Subir a IONOS (Frontend)

1.  **Acceso SFTP**:
    *   En tu panel de IONOS (la captura que enviaste), busca la sección **SFTP**.
    *   Crea un usuario si no tienes uno. Anota:
        *   **Servidor**: (ej. `access-xxxx.webspace-host.com`)
        *   **Usuario**: (ej. `u12345678`)
        *   **Contraseña**: La que definas.
        *   **Puerto**: 22 (generalmente).

2.  **Usar FileZilla (o WinSCP)**:
    *   Descarga e instala FileZilla Client.
    *   Conéctate con los datos de arriba.
    *   En el lado derecho (Servidor), verás una carpeta (a veces llamada `clickandbuilds` o simplemente la raíz `/`).
    *   Busca la carpeta pública (a veces es la raíz, o debes crear una carpeta ej: `spbasket`).
    *   **SUBIR**: Arrastra **todo el contenido** de tu carpeta local `dist/sp-basket/browser` (incluyendo el `.htaccess` que creamos) a la carpeta del servidor.
    *   **IMPORTANTE**: No subas la carpeta `browser` entera, sube los *archivos* que hay dentro. De forma que `index.html` quede en la raíz de tu dominio.

3.  **Apuntar Dominio (Si es necesario)**:
    *   En IONOS > Dominios, asegúrate de que tu dominio apunta a la carpeta donde subiste los archivos (ej: `/` o `/spbasket`).

---

## 🔌 PASO 3: Conectar con el Backend

Como explicamos, el backend no correrá en este hosting de IONOS tal cual.

*   Si decides subir el backend a **Render/Vercel**:
    1.  Obtén la URL de tu backend (ej: `https://sp-basket-api.onrender.com`).
    2.  Edita el archivo `src/environments/environment.prod.ts` en tu proyecto Angular **ANTES** de hacer el build:
        ```typescript
        export const environment = {
          production: true,
          apiUrl: 'https://tu-backend-url.com/api'
        };
        ```
    3.  Vuelve a hacer el `ng build` y sube los archivos de nuevo.

*Mientras tanto, tu web en IONOS se verá, pero las noticias, login y productos no cargarán datos hasta que el backend esté online en un lugar compatible con Node.js.*
