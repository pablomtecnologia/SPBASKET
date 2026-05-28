@echo off
setlocal enabledelayedexpansion

set PASSWORD=Saskipenguins2o24@
set SERVER=root@94.143.142.26
set BACKEND_PATH=/var/www/spbasket/backend

echo.
echo ===================================================
echo   DESPLIEGUE COMPLETO SP BASKET CON DATOS EN VIVO
echo ===================================================
echo.

echo 1. COMPILANDO FRONTEND (ANGULAR)...
cd sp-basket
call npm run build
if %errorlevel% neq 0 (
    echo ERROR EN BUILD ANGULAR. REVISA LOGS.
    pause
    exit /b 1
)
cd ..

echo.
echo 2. EMPAQUETANDO FRONTEND...
if exist frontend.zip del frontend.zip
powershell -Command "Compress-Archive -Path 'sp-basket\dist\sp-basket\browser\*' -DestinationPath 'frontend.zip' -Force"

echo.
echo 3. SUBIENDO ARCHIVOS AL SERVIDOR...
echo Cuando pida password: %PASSWORD%

echo - Subiendo Frontend...
pscp -pw %PASSWORD% frontend.zip %SERVER%:/tmp/

echo - Subiendo Backend (Server + Scrapers + Package.json)...
pscp -pw %PASSWORD% backend\server.js %SERVER%:/tmp/
pscp -pw %PASSWORD% backend\live-scraper.js %SERVER%:/tmp/
pscp -pw %PASSWORD% backend\scraper-fecan.js %SERVER%:/tmp/
pscp -pw %PASSWORD% backend\fecan-auto-scraper.js %SERVER%:/tmp/
pscp -pw %PASSWORD% backend\package.json %SERVER%:/tmp/

echo.
echo 4. INSTALANDO EN SERVIDOR...
echo Ejecutando comandos remotos...

plink -batch -pw %PASSWORD% %SERVER% "echo '--- Descomprimiendo Frontend ---' && unzip -o /tmp/frontend.zip -d /var/www/html/"

plink -batch -pw %PASSWORD% %SERVER% "echo '--- Actualizando Backend ---' && cp /tmp/server.js %BACKEND_PATH%/ && cp /tmp/live-scraper.js %BACKEND_PATH%/ && cp /tmp/scraper-fecan.js %BACKEND_PATH%/ && cp /tmp/fecan-auto-scraper.js %BACKEND_PATH%/ && cp /tmp/package.json %BACKEND_PATH%/"

echo.
echo 5. INSTALANDO DEPENDENCIAS DE SCRAPING...
plink -batch -pw %PASSWORD% %SERVER% "cd %BACKEND_PATH% && npm install playwright cheerio && npx playwright install chromium --with-deps && pm2 restart all"

echo.
echo 6. LIMPIEZA LOCAL...
del frontend.zip

echo.
echo ===================================================
echo        DESPLIEGUE FINALIZADO CON EXITO
echo ===================================================
echo.
pause
