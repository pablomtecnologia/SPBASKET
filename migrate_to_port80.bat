@echo off
set SERVER_IP=94.143.142.26
set USER=root

echo ==========================================
echo   MIGRANDO SP BASKET A PUERTO 80 (ADIOS NGINX)
echo ==========================================
echo.

echo 1. CONSTRUYENDO FRONTEND (CON RUTA RELATIVA)...
cd sp-basket
call npm run build
if %errorlevel% neq 0 (
    echo Error en el build.
    pause
    exit /b
)
cd ..
echo Build OK.
echo.

echo 2. DETENIENDO NGINX EN SERVIDOR (LIBERAR PUERTO 80)...
ssh %USER%@%SERVER_IP% "systemctl stop nginx && systemctl disable nginx"
echo Puerto 80 liberado.
echo.

echo 3. SUBIENDO TODO (FRONTEND Y BACKEND)...
scp -r sp-basket/dist/sp-basket/browser/* %USER%@%SERVER_IP%:/var/www/spbasket/dist/sp-basket/browser/
scp backend/server.js %USER%@%SERVER_IP%:/var/www/spbasket/backend/
echo.

echo 4. REINICIANDO NODEJS EN PUERTO 80...
:: Usamos --update-env para asegurar que coja el cambio de puerto si esta en env vars, 
:: pero aqui lo hemos hardcodeado en codigo.
ssh %USER%@%SERVER_IP% "pm2 stop spbasket-api && pm2 stop all && pm2 delete all && pm2 start /var/www/spbasket/backend/server.js --name spbasket-api --time"
echo.

echo ==========================================
echo   MIGRACION COMPLETADA
echo ==========================================
echo AHORA LA WEB CARGA DIRECTAMENTE DESDE NODEJS.
echo PRUEBA ENTRAR A: http://94.143.142.26 (SIN :3001)
pause
