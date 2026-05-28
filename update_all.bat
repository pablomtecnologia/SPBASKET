@echo off
set SERVER_IP=94.143.142.26
set USER=root

echo ==========================================
echo    ACTUALIZANDO SP BASKET (SIN NGINX)
echo ==========================================
echo.

echo 1. CONSTRUYENDO FRONTEND (FIX RUTAS)...
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

echo 2. SUBIENDO CAMBIOS...
:: Subimos Todo el Frontend porque hemos tocado rutas de imagenes
scp -r sp-basket/dist/sp-basket/browser/* %USER%@%SERVER_IP%:/var/www/spbasket/dist/sp-basket/browser/
:: Subimos Backend (Server.js) porque hemos arreglado lo de las Reservas (JSONB)
scp backend/server.js %USER%@%SERVER_IP%:/var/www/spbasket/backend/
echo.

echo 3. REINICIANDO TODO (AGRESIVO)...
ssh %USER%@%SERVER_IP% "systemctl stop nginx || true"
ssh %USER%@%SERVER_IP% "pm2 delete all || true"
ssh %USER%@%SERVER_IP% "PORT=80 pm2 start /var/www/spbasket/backend/server.js --name spbasket-final --time"
echo.

echo ==========================================
echo          TODO LISTO
echo ==========================================
pause
