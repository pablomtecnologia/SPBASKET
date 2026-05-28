@echo off
set SERVER_IP=94.143.142.26
set USER=root
set REMOTE_FRONTEND=/var/www/html
set REMOTE_BACKEND=/root/SPBASKET/backend

echo ==========================================
echo      DESPLEGANDO SP BASKET A PROD
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

echo 2. SUBIENDO FRONTEND A %REMOTE_FRONTEND%...
echo (Introduce la contrasenia de %USER% si se solicita)
scp -r sp-basket/dist/sp-basket/browser/* %USER%@%SERVER_IP%:%REMOTE_FRONTEND%/
echo.

echo 3. SUBIENDO BACKEND A %REMOTE_BACKEND%...
scp backend/server.js %USER%@%SERVER_IP%:%REMOTE_BACKEND%/
echo.

echo 4. REINICIANDO SERVIDOR BACKEND...
ssh %USER%@%SERVER_IP% "pm2 restart server"
echo.

echo ==========================================
echo        DESPLIEGUE COMPLETADO
echo ==========================================
pause
