@echo off
set SERVER_IP=94.143.142.26
set USER=root
:: RUTA CORRECTA DESCUBIERTA: /var/www/html Y /var/www/spbasket/backend
set REMOTE_FRONTEND=/var/www/html
set REMOTE_BACKEND=/var/www/spbasket/backend

echo ==========================================
echo      DESPLEGANDO SP BASKET A PROD
echo ==========================================
echo.

echo 1. SUBIENDO BACKEND CORRECTO A %REMOTE_BACKEND%...
echo (Introduce la contrasenia de %USER% si se solicita)
scp backend/server.js %USER%@%SERVER_IP%:%REMOTE_BACKEND%/
echo.

echo 2. REINICIANDO SERVIDOR BACKEND...
ssh %USER%@%SERVER_IP% "pm2 restart spbasket-backend 2> /dev/null || pm2 restart server 2> /dev/null || pm2 restart all"
echo.

echo ==========================================
echo        DESPLIEGUE FINALIZADO
echo ==========================================
pause
