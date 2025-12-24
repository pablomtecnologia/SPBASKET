# 📧 CONFIGURACIÓN DEL ENVÍO DE EMAILS

## ⚠️ IMPORTANTE: SIN ESTO NO SE ENVIARÁN LOS RECONOCIMIENTOS MÉDICOS

Para que funcione el envío de reconocimientos médicos a `pablomtecnologia@gmail.com`, **DEBES configurar las credenciales SMTP de Gmail**.

---

## 📋 **Pasos para configurar (5 minutos)**

### 1️⃣ **Crear una contraseña de aplicación de Gmail**

1. Ve a tu cuenta de Gmail: <https://myaccount.google.com/security>
2. Busca la sección **"Verificación en dos pasos"**
   - Si **NO** está activada → **Actívala primero**
   - Si **SÍ** está activada → Continúa al siguiente paso
3. Una vez activada la verificación en dos pasos, busca **"Contraseñas de aplicaciones"**
4. Haz clic en **"Contraseñas de aplicaciones"**
5. En "Selecciona la aplicación", elige **"Correo"**
6. En "Selecciona el dispositivo", elige **"Otro (nombre personalizado)"**
7. Escribe: `SP Basket Backend`
8. Haz clic en **"Generar"**
9. **¡COPIA LA CONTRASEÑA!** (16 caracteres, sin espacios)

---

### 2️⃣ **Configurar el archivo `.env`**

1. Abre el archivo `.env` en la carpeta `backend`:
   ```cmd
   cd C:\Users\pablo\Desktop\SPBASKET\backend
   notepad .env
   ```

2. Busca estas líneas:
   ```env
   SMTP_USER=pablomtecnologia@gmail.com
   SMTP_PASS=TU_CONTRASEÑA_DE_APLICACION_AQUI
   ```

3. **Reemplaza** `TU_CONTRASEÑA_DE_APLICACION_AQUI` por la contraseña que copiaste:
   ```env
   SMTP_USER=pablomtecnologia@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   ```
   (Ejemplo de contraseña, usa la tuya)

4. **Guarda el archivo** (`Ctrl + S`) y cierra notepad

---

### 3️⃣ **Reiniciar el backend**

1. Si el backend está corriendo, **deténlo** (`Ctrl + C` en la ventana CMD)
2. **Vuelve a iniciarlo**:
   ```cmd
   node server.js
   ```

3. Deberías ver:
   ```
   🚀 Backend listening on http://localhost:3000
   ✅ MySQL conectado - 3 usuarios en la base de datos
   ```

---

## ✅ **Probar que funciona**

1. Ve a <http://localhost:4201/login>
2. Inicia sesión con: `admin` / `spbasket2024`
3. Ve a **Documentación**
4. Rellena el formulario de **"Adjuntar Reconocimiento Médico"**:
   - Nombre: Tu nombre
   - Apellidos: Tus apellidos
   - Email: Tu email
   - Licencia: (Opcional)
   - Archivo: Elige un PDF cualquiera
5. Haz clic en **"Enviar Reconocimiento Médico"**
6. **Revisa la bandeja** de `pablomtecnologia@gmail.com`
   - Deberías recibir un email con el asunto: "📋 Reconocimiento médico: [Nombre] [Apellidos]"
   - El archivo PDF estará adjunto

---

## 🔍 **Solución de problemas**

### ❌ No se envió el correo

1. **Revisa la consola del backend** (ventana CMD donde ejecutaste `node server.js`)
   - Si ves `✅ Email enviado:` → El email se envió correctamente
   - Si ves `❌ Error enviando email: Invalid login` → La contraseña de aplicación es incorrecta
   - Si ves `❌ Error enviando email: Connection timeout` → Problema de conexión a internet

2. **Verifica el archivo `.env`**:
   ```cmd
   cd C:\Users\pablo\Desktop\SPBASKET\backend
   type .env
   ```
   - Asegúrate de que `SMTP_PASS` tiene tu contraseña de aplicación de Gmail
   - **NO debe haber espacios** antes o después del `=`

3. **Crea una nueva contraseña de aplicación**:
   - A veces las contraseñas expiran o se desactivan
   - Ve de nuevo a <https://myaccount.google.com/security>
   - Elimina la aplicación "SP Basket Backend"
   - Crea una nueva contraseña de aplicación
   - Actualiza el `.env` con la nueva contraseña
   - Reinicia el backend

---

## 📝 **Archivo `.env` completo de ejemplo**

```env
# JWT Secret
JWT_SECRET=MI_SECRETA_SUPER_SPBASKET_2024

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_DATABASE=spbasket

# SMTP (Gmail)
SMTP_USER=pablomtecnologia@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

(Reemplaza `tu_contraseña_mysql` y la contraseña SMTP por las tuyas)

---

## ✅ **¡Listo!**

Una vez configurado, **todos los formularios de reconocimiento médico se enviarán automáticamente** a `pablomtecnologia@gmail.com` con el archivo PDF adjunto. 📧🏀
