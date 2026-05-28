@echo off
set SERVER_IP=94.143.142.26
set USER=root

echo ==========================================
echo    RESTAURACION DE EMERGENCIA DE BBDD
echo ==========================================
echo.
echo 1. SUBIENDO SERVER.JS CON CREDENCIALES FIJAS...
scp backend/server.js %USER%@%SERVER_IP%:/var/www/spbasket/backend/
echo.

echo 2. REINICIANDO TODO...
ssh %USER%@%SERVER_IP% "pm2 restart spbasket-api"
echo.

echo 3. CHECK STATUS...
ssh %USER%@%SERVER_IP% "pm2 status"
echo.

echo ==========================================
echo          SISTEMA REINICIADO
echo ==========================================
pause
