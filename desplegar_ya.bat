@echo off
set "PASSWORD=Saskipenguins2o24@"
set "SERVER=root@94.143.142.26"
set "BACKEND_PATH=/var/www/spbasket/backend"

echo ===========================================
echo   DESPLIEGUE SENCILLO SP BASKET (v3)
echo ===========================================
echo.

echo 1. COMPILANDO FRONTEND...
cd sp-basket
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al compilar Angular.
    pause
    exit /b 1
)
cd ..

echo.
echo 2. CREANDO ZIP...
if exist frontend.zip del frontend.zip
powershell -Command "Compress-Archive -Path 'sp-basket\dist\sp-basket\browser\*' -DestinationPath 'frontend.zip' -Force"

echo.
echo 3. SUBIENDO ARCHIVOS...
echo IMPORTANTE: Escribe la contrasena %PASSWORD% cuando se te pida.
echo.

echo [Subiendo ZIP Frontend...]
scp frontend.zip %SERVER%:/tmp/

echo [Subiendo Scripts Backend...]
scp backend\server.js backend\live-scraper.js backend\scraper-fecan.js backend\fecan-auto-scraper.js backend\package.json %SERVER%:/tmp/

echo.
echo 4. INSTALANDO EN SERVIDOR...
echo Escribe la contrasena %PASSWORD% una vez mas.
ssh %SERVER% "echo '--- Descomprimiendo ---' && unzip -o /tmp/frontend.zip -d /var/www/html/ && echo '--- Copiando Backend ---' && cp /tmp/server.js %BACKEND_PATH%/ && cp /tmp/live-scraper.js %BACKEND_PATH%/ && cp /tmp/scraper-fecan.js %BACKEND_PATH%/ && cp /tmp/fecan-auto-scraper.js %BACKEND_PATH%/ && cp /tmp/package.json %BACKEND_PATH%/ && echo '--- Instalando dependencias ---' && cd %BACKEND_PATH% && npm install playwright cheerio && npx playwright install chromium --with-deps && pm2 restart all"

echo.
echo ===========================================
echo        ¡DESPLIEGUE COMPLETADO!
echo ===========================================
echo.
pause
