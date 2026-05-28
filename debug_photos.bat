@echo off
set SERVER_IP=94.143.142.26
set USER=root

echo ==========================================
echo    DEBUGGING FOTOS Y ARREGLO RESERVAS
echo ==========================================
echo.

echo 1. SUBIENDO SERVER.JS ARREGLADO (RESERVAS)...
scp backend/server.js %USER%@%SERVER_IP%:/var/www/spbasket/backend/
echo.

echo 2. REINICIANDO BACKEND...
ssh %USER%@%SERVER_IP% "pm2 restart spbasket-api"
echo.

echo 3. LISTANDO IMAGENES EN SERVIDOR (PARA VERIFICAR NOMBRES)...
ssh %USER%@%SERVER_IP% "find /var/www/spbasket/dist/sp-basket/browser/assets -name *.jpg"
echo.

echo ==========================================
echo          DEBUG COMPLETADO
echo ==========================================
pause
