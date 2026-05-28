@echo off
set SERVER_IP=94.143.142.26
set USER=root

:: RUTA 1: Para Node.js (Fallback y API)
set REMOTE_NODE_PATH=/var/www/spbasket/dist/sp-basket/browser

:: RUTA 2: Para Nginx (Servidor Web Principal)
set REMOTE_NGINX_PATH=/var/www/html

set REMOTE_BACKEND=/var/www/spbasket/backend

echo ==========================================
echo    DESPLIEGUE FINAL DE SP BASKET (DOBLE)
echo ==========================================
echo.

echo 1. CONSTRUYENDO FRONTEND (ANGULAR)...
cd sp-basket
call npm run build
if %errorlevel% neq 0 (
    echo Error en el build. Cancelando.
    pause
    exit /b
)
cd ..
echo Build correcto.
echo.

echo 2. SUBIENDO FRONTEND A RUTA NODEJS (%REMOTE_NODE_PATH%)...
echo (Introduce la contrasenia de %USER%)
scp -r sp-basket/dist/sp-basket/browser/* %USER%@%SERVER_IP%:%REMOTE_NODE_PATH%/
echo.

echo 3. SUBIENDO FRONTEND A RUTA NGINX (%REMOTE_NGINX_PATH%)...
echo (Introduce la contrasenia de %USER% OTRA VEZ)
scp -r sp-basket/dist/sp-basket/browser/* %USER%@%SERVER_IP%:%REMOTE_NGINX_PATH%/
echo.

echo 4. SUBIENDO BACKEND...
scp backend/server.js %USER%@%SERVER_IP%:%REMOTE_BACKEND%/
echo.

echo 5. REINICIANDO SERVIDOR...
ssh %USER%@%SERVER_IP% "pm2 restart all"
echo.

echo ==========================================
echo        DESPLIEGUE COMPLETADO
echo ==========================================
pause
