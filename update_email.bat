@echo off
set SERVER_IP=94.143.142.26
set USER=root

echo ==========================================
echo    ACTUALIZACION FINAL (CORREO)
echo ==========================================
echo 1. SUBIENDO SERVER.JS (EMAIL CONFIGURADO)...
scp backend/server.js %USER%@%SERVER_IP%:/var/www/spbasket/backend/
echo.
echo 2. REINICIANDO...
ssh %USER%@%SERVER_IP% "pm2 restart spbasket-api"
echo.
echo ==========================================
echo LISTO. PRUEBA A RESERVAR AHORA.
echo SI FALLA EL EMAIL, ES PORQUE NO SE PUDO INSTALAR NODEMAILER EN SERVIDOR.
echo EN ESE CASO EJECUTA: ssh root@... "cd /var/www/spbasket/backend && npm install nodemailer"
echo ==========================================
pause
