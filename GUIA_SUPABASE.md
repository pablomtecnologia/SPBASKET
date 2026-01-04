# 🗄️ GUÍA: Cambiar a Supabase (PostgreSQL)

IONOS no permite conexiones externas en sus bases de datos compartidas.
Por eso Render da error (`ENOTFOUND`): no puede "ver" a IONOS.

Como **tú pedías originalmente**, vamos a usar **Supabase**, que es **gratis** y permite conexiones externas.

## PASO 1: Crear Base de Datos en Supabase
1.  Entra en [supabase.com](https://supabase.com) y regístrate (es gratis).
2.  Dale a **"New Project"**.
3.  Ponle nombre (ej: `spbasket`) y una contraseña fuerte (¡APÚNTALA!).
4.  Elige región "Frankfurt" (o la más cercana).
5.  Espera a que se cree (tarda 1-2 min).

## PASO 2: Obtener la URL de Conexión
1.  En tu proyecto de Supabase, ve a **Settings** (rueda dentada abajo a la izquierda) -> **Database**.
2.  Busca **"Connection String"** -> **URI**.
3.  Copia la cadena entera. Se verá así:
    `postgresql://postgres.xxxx:[TU-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
    *(Tendrás que reemplazar `[YOUR-PASSWORD]` por la contraseña que pusiste en el paso 1).*

## PASO 3: Actualizar Render
1.  Ve a tu servicio en Render (`spbasket`).
2.  Ve a **Environment Variables**.
3.  **BORRA** las variables de IONOS (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_PORT`).
4.  **AÑADE** una única variable nueva:
    *   **Key:** `DATABASE_URL`
    *   **Value:** *(Pega la URI de Supabase del paso 2)*

## PASO 4: Confirmar al Agente
Una vez tengas la URI puesta en Render:
1.  **Dime "Ya tengo Supabase y he puesto la variable en Render".**
2.  Yo subiré automáticamente el código del backend adaptado a PostgreSQL (ya que ahora mismo está en MySQL y fallará si no lo cambio).

---
**IMPORTANTE:** Mientras haces esto, yo estoy reescribiendo el código `server.js` internamente para que funcione con PostgreSQL. ¡Avísame cuando tengas la base de datos lista!
