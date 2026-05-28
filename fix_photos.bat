@echo off
set SERVER_IP=94.143.142.26
set USER=root
set REMOTE_BACKEND=/var/www/spbasket/backend

echo ==========================================
echo    REPARACION RAPIDA DE FOTOS (SOLO BACKEND)
echo ==========================================
echo.
echo No subiremos toda la web, solo el "cerebro" (server.js) para que sirva las fotos.
echo.

echo 1. SUBIENDO SERVER.JS PARCHEADO...
scp backend/server.js %USER%@%SERVER_IP%:%REMOTE_BACKEND%/
echo.

echo 2. REINICIANDO...
ssh %USER%@%SERVER_IP% "pm2 restart spbasket-api"
echo.

echo ==========================================
echo        PARCHE APLICADO
echo ==========================================
pause
