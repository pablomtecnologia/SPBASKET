@echo off
set SERVER_IP=94.143.142.26
set USER=root

echo ==========================================
echo    RESCATE FINAL (DB RESTORE)
echo ==========================================
echo.
echo 1. SUBIENDO SERVER.JS CON CREDENCIALES ORIGINALES...
scp backend/server.js %USER%@%SERVER_IP%:/var/www/spbasket/backend/
echo.

echo 2. REINICIANDO BACKEND...
ssh %USER%@%SERVER_IP% "pm2 restart spbasket-api"
echo.

echo ==========================================
echo          INTENTANDO VOLVER A LA VIDA
echo ==========================================
pause
