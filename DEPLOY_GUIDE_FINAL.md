# 🚀 GUÍA FINAL: Conectar Backend (Render) y Frontend (IONOS)

Sigue estos pasos EXACTOS para terminar tu web hoy mismo.

## ✅ PASO 1: Subir los últimos cambios a GitHub
Necesitamos que el cambio que acabo de hacer (permitir `saskipenguins.es`) esté en la nube.

1.  Abre una terminal en `c:\Users\pablo\Desktop\SPBASKET`.
2.  Ejecuta estos 3 comandos:
    ```bash
    git add .
    git commit -m "Configurar CORS para saskipenguins.es"
    git push
    ```

## ☁️ PASO 2: Crear el Backend en Render
1.  Ve a [dashboard.render.com](https://dashboard.render.com).
2.  Click en **"New +"** -> **"Web Service"**.
3.  Selecciona tu repositorio **SPBASKET**.
4.  Rellena el formulario:
    *   **Name:** `spbasket-api`
    *   **Region:** Frankfurt (EU Central)
    *   **Branch:** `main`
    *   **Root Directory:** `backend` (⚠️ ¡No lo olvides!)
    *   **Runtime:** Node
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
    *   **Plan:** Free

5.  Baja a **"Environment Variables"** y añade tus datos de IONOS (Búscalos en tu email o panel de IONOS si no los recuerdas, o usa los que están en `backend/.env` si son correctos):

    | Key | Value (Ejemplo) |
    | :--- | :--- |
    | `DB_HOST` | `db50XXXXX.hosting-data.io` |
    | `DB_USER` | `dboXXXXX` |
    | `DB_PASSWORD` | *(Tu contraseña de la base de datos)* |
    | `DB_DATABASE` | `dbsXXXXX` |
    | `JWT_SECRET` | `secretosuperseguro` |
    | `PORT` | `3001` (Opcional, Render lo asigna solo, pero no estorba) |

6.  Dale a **"Create Web Service"**.
7.  Espera a que salga el check verde **Live**.
8.  **COPIA LA URL** que te da Render (ej: `https://spbasket-api.onrender.com`).

---

## 🔗 PASO 3: Conectar el Frontend
Ahora que tienes la URL del backend, hay que decírselo al frontend.

1.  En tu ordenador, abre el archivo:
    `c:\Users\pablo\Desktop\SPBASKET\sp-basket\src\environments\environment.prod.ts`
    *(Si no existe, dímelo y lo creamos).*
    
2.  Cambia `apiUrl` por tu nueva URL de Render:
    ```typescript
    export const environment = {
      production: true,
      apiUrl: 'https://spbasket-api.onrender.com' // <-- PEGA TU URL AQUÍ (sin barra al final)
    };
    ```

3.  Guarda el archivo.

## 📦 PASO 4: Construir y Subir a IONOS
1.  En la terminal, entra en la carpeta del frontend:
    ```bash
    cd sp-basket
    ```
2.  Crea la versión final:
    ```bash
    ng build --configuration production --base-href /
    ```
3.  Cuando termine, abre **FileZilla**.
4.  Navega a la carpeta local: `c:\Users\pablo\Desktop\SPBASKET\sp-basket\dist\sp-basket\browser`.
5.  Sube **TODO** el contenido de esa carpeta a tu carpeta `/` (raíz) en IONOS, sobrescribiendo lo que haya.
6.  Asegúrate de que el archivo `.htaccess` también está en IONOS (si no, súbelo desde la carpeta raíz del proyecto).

¡Y LISTO! 🎉
Tu web `https://saskipenguins.es` ahora debería registrar usuarios, hacer login y cargar noticias.
