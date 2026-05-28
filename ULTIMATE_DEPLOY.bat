@echo off
setlocal enabledelayedexpansion

:: --- CONFIGURACION ---
set SERVER=root@94.143.142.26
set PASSWORD=Saskipenguins2o24@
set REMOTE_BASE=/var/www/spbasket
set REMOTE_BACKEND=%REMOTE_BASE%/backend
set REMOTE_FRONTEND=/var/www/html

echo ========================================================
echo   🚀 INICIANDO DESPLIEGUE DEFINITIVO (SP BASKET)
echo ========================================================
echo.

:: 1. COMPILAR FRONTEND
echo [1/5] Compilando Frontend (Angular)...
cd sp-basket
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: La compilacion del frontend ha fallado.
    pause
    exit /b 1
)
cd ..

:: 2. EMPAQUETAR FRONTEND
echo [2/5] Preparando paquete de archivos...
if exist frontend_deploy.zip del frontend_deploy.zip
powershell -Command "Compress-Archive -Path 'sp-basket\dist\sp-basket\browser\*' -DestinationPath 'frontend_deploy.zip' -Force"

:: 3. SUBIR ARCHIVOS
echo [3/5] Subiendo Frontend y Backend al servidor...
:: Subimos el zip del front, el server.js y el .env (por si hubo cambios en variables)
scp frontend_deploy.zip %SERVER%:/tmp/
scp backend/server.js %SERVER%:/tmp/
:: Opcional: scp backend/.env %SERVER%:%REMOTE_BACKEND%/.env

:: 4. DESPLEGAR EN EL SERVIDOR
echo [4/5] Instalando cambios en el servidor...
ssh %SERVER% "unzip -o /tmp/frontend_deploy.zip -d /var/www/html/ && cp /tmp/server.js /var/www/spbasket/backend/ && chown -R www-data:www-data /var/www/html && pm2 restart all && rm /tmp/frontend_deploy.zip /tmp/server.js"

:: 5. SINCRONIZAR IMAGENES (Uploads)
echo [5/5] Sincronizando imagenes (uploads)...
scp -r backend/uploads %SERVER%:%REMOTE_BACKEND%/

echo.
echo ========================================================
echo   ✅ ¡DESPLIEGUE COMPLETADO CON EXITO!
echo   La web deberia estar actualizada en: saskipenguins.es
echo ========================================================
echo.
pause
