# GUÍA FINAL: Subir Backend y Frontend a IONOS

## 🌎 PARTE 1: Frontend (Arreglar las fotos)
He regenerado la web con una configuración especial para que funcionen las fotos.

1.  Abre **FileZilla**.
2.  Entra en la carpeta de tu ordenador: `c:\Users\pablo\Desktop\SPBASKET\sp-basket\dist\sp-basket\browser`
3.  Arrastra **TODO** lo que hay dentro hacia tu carpeta de IONOS.
    *   *Nota: No arrastres la carpeta "browser", sino los archivos que tiene dentro.*
4.  Sube también el archivo `.htaccess` que preparé antes.

---

## 💾 PARTE 2: Base de Datos (MySQL)

Tu servidor IONOS te permite crear bases de datos.
1.  Entra en **IONOS** -> **Hosting** -> **Bases de Datos**.
2.  Dale a **"Crear Base de Datos"**:
    *   Tipo: MySQL
    *   Descripción: `spbasket`
    *   Contraseña: Pon una segura y **APÚNTALA**.
3.  Cuando se cree, dale a **"Abrir phpMyAdmin"**.
4.  Dentro de phpMyAdmin, ve a la pestaña **"Importar"**.
5.  Selecciona el archivo que te he creado en el escritorio: `base_de_datos.sql`
6.  Dale a **Continuar**.
    *   *¡Listo! Ya tienes tus usuarios y noticias en la nube.*

---

## ⚙️ PARTE 3: El Backend (Lo Complicado)

Aquí viene la realidad de tu plan de hosting ("Espacio Web"):
**IONOS NO permite ejecutar el servidor `node server.js` de forma permanente en estos planes.**
Están pensados para PHP, no para Node.js.

### ¿Qué opciones tienes?

1.  **Opción PRO (Recomendada):** Subir el Backend a **Render.com** (es gratis).
    *   Te creas cuenta en Render.
    *   Conectas tu GitHub.
    *   Despliegas el backend.
    *   En las "Variables de Entorno" de Render pones los datos de tu Base de Datos de IONOS (Host, User, Password) para que se conecten.

2.  **Opción IONOS VPS:** Tendrías que pagar un servidor VPS en IONOS (más caro y difícil de configurar) para poder ejecutar `npm start`.

### Mi Consejo
Sube el Frontend a IONOS ahora mismo para que veas la web bonita.
Si quieres que funcionen el login y los registros, **dímelo y te guío para poner el backend en Render conectado a tu base de datos de IONOS**. Es la forma profesional de hacerlo sin pagar más.
