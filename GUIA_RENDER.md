# 🚀 GUÍA: Desplegar Backend en Render.com

Yo ya he preparado todo el código. Solo tienes que seguir estos pasos para poner el cerebro de tu web en internet.

## PASO 1: Subir código a GitHub
Abre una terminal en tu ordenador (donde estés ahora) y escribe:
```bash
git push
```
*(Si te pide usuario/contraseña, ponlos. Si ya estás logueado, se subirá directo).*

---

## PASO 2: Crear Servicio en Render (Gratis)
1.  Entra en [dashboard.render.com](https://dashboard.render.com).
2.  Haz clic en el botón **"New +"** (arriba derecha) y elige **"Web Service"**.
3.  Selecciona tu repositorio **SPBASKET** de la lista (o GitHub).
4.  Dale a **"Connect"**.

## PASO 3: Configurar el Backend
Rellena el formulario así:
*   **Name:** `spbasket-api` (o lo que quieras).
*   **Region:** Frankfurt (es la más rápida para España).
*   **Branch:** `main`
*   **Root Directory:** `backend`  <-- **¡MUY IMPORTANTE!** (Escribe `backend` aquí).
*   **Runtime:** Node
*   **Build Command:** `npm install`
*   **Start Command:** `node server.js`
*   **Plan:** Free

## PASO 4: Las Variables de Entorno (Conectar con IONOS)
Baja hasta la sección **"Environment Variables"**.
Tienes que añadir estas claves y valores (copia los valores exactos de tu phpMyAdmin de IONOS que tienes abierto):

| Key (Clave) | Value (Valor) | ¿De dónde lo saco? |
| :--- | :--- | :--- |
| `DB_HOST` | `db50...hosting-data.io` | phpMyAdmin > "Nombre de host" |
| `DB_USER` | `dbo...` | phpMyAdmin > "Nombre de usuario" |
| `DB_PASSWORD` | *(Tu contraseña de BD)* | La que pusiste al crearla en IONOS |
| `DB_DATABASE` | `dbs...` | El nombre que sale a la izquierda (ej: dbs15131581) |
| `JWT_SECRET` | `spbasket_secreto_2026` | (Inventa una o usa esta) |
| `SMTP_USER` | `pablomtecnologia@gmail.com` | Tu correo para enviar alertas |
| `SMTP_PASS` | *(Tu contraseña de aplicación)* | La que ya teníamos configurada |

Dale a **"Create Web Service"**.

---

## PASO 5: Conectar Frontend con Backend
Una vez Render termine (saldrá "Live" en verde):
1.  Copia la URL que te da Render (ej: `https://spbasket-api.onrender.com`).
2.  Ve a tu código en el PC, archivo: `sp-basket/src/environments/environment.prod.ts`.
3.  Pega esa URL en `apiUrl`.
4.  Ejecuta en tu terminal:
    ```bash
    ng build --configuration production --base-href ./
    ```
5.  Sube los archivos nuevos de `dist` a IONOS con FileZilla una última vez.

¡Y LISTO! Tendrás web en IONOS y Backend en Render conectados.
