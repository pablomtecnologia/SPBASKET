@echo off
setlocal enabledelayedexpansion

set PASSWORD=Saskipenguins2o24@
set SERVER_USER=root
set SERVER_IP=94.143.142.26
set SERVER=%SERVER_USER%@%SERVER_IP%
set BACKEND_PATH=/var/www/spbasket/backend

echo.
echo ===================================================
echo   DESPLIEGUE SP BASKET V2 (DIAGNOSTICO Y ROBUSTO)
echo ===================================================
echo.

REM --- 1. VERIFICACION DE HERRAMIENTAS ---
where pscp >nul 2>nul
if %errorlevel% equ 0 (
    set USE_PUTTY=1
    echo [INFO] Herramientas Putty (pscp/plink) detectadas.
) else (
    set USE_PUTTY=0
    echo [INFO] Putty no detectado. Se usara OpenSSH nativo (scp/ssh).
    echo [INFO] Preparate para escribir la contrasena: %PASSWORD% varias veces.
)

REM --- 2. BUILD FRONTEND ---
echo.
echo [1/6] COMPILANDO FRONTEND...
cd sp-basket
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo en 'npm run build'. Revisa los errores arriba.
    pause
    exit /b 1
)
cd ..

REM --- 3. ZIP FRONTEND ---
echo.
echo [2/6] EMPAQUETANDO...
if exist frontend.zip del frontend.zip
powershell -Command "Compress-Archive -Path 'sp-basket\dist\sp-basket\browser\*' -DestinationPath 'frontend.zip' -Force"
if not exist frontend.zip (
    echo [ERROR] No se genero frontend.zip.
    pause
    exit /b 1
)

REM --- 4. SUBIDA DE ARCHIVOS ---
echo.
echo [3/6] SUBIENDO ARCHIVOS...

if %USE_PUTTY% equ 1 (
    echo Usando PSCP (Automatico)...
    pscp -pw %PASSWORD% frontend.zip %SERVER%:/tmp/
    pscp -pw %PASSWORD% backend\server.js %SERVER%:/tmp/
    pscp -pw %PASSWORD% backend\live-scraper.js %SERVER%:/tmp/
    pscp -pw %PASSWORD% backend\scraper-fecan.js %SERVER%:/tmp/
    pscp -pw %PASSWORD% backend\fecan-auto-scraper.js %SERVER%:/tmp/
    pscp -pw %PASSWORD% backend\package.json %SERVER%:/tmp/
) else (
    echo Usando SCP (Manual)...
    echo Subiendo ZIP...
    scp frontend.zip %SERVER%:/tmp/
    echo Subiendo Backend scripts...
    scp backend\server.js backend\live-scraper.js backend\scraper-fecan.js backend\fecan-auto-scraper.js backend\package.json %SERVER%:/tmp/
)

if %errorlevel% neq 0 (
    echo [ERROR] Fallo al subir archivos. Verifica conexion.
    pause
    exit /b 1
)

REM --- 5. INSTALACION Y DESPLIEGUE ---
echo.
echo [4/6] DESPLEGANDO EN SERVIDOR...

set REMOTE_CMD="echo '--- Descomprimiendo Frontend ---' && unzip -o /tmp/frontend.zip -d /var/www/html/ && echo '--- Copiando Backend ---' && cp /tmp/server.js %BACKEND_PATH%/ && cp /tmp/live-scraper.js %BACKEND_PATH%/ && cp /tmp/scraper-fecan.js %BACKEND_PATH%/ && cp /tmp/fecan-auto-scraper.js %BACKEND_PATH%/ && cp /tmp/package.json %BACKEND_PATH%/"

if %USE_PUTTY% equ 1 (
    plink -batch -pw %PASSWORD% %SERVER% %REMOTE_CMD%
) else (
    ssh %SERVER% %REMOTE_CMD%
)

REM --- 6. INSTALACION DE DEPENDENCIAS ---
echo.
echo [5/6] INSTALANDO PLAYWRIGHT Y REINICIANDO...

set INSTALL_CMD="cd %BACKEND_PATH% && npm install playwright cheerio && npx playwright install chromium --with-deps && pm2 restart all"

if %USE_PUTTY% equ 1 (
    plink -batch -pw %PASSWORD% %SERVER% %INSTALL_CMD%
) else (
    ssh %SERVER% %INSTALL_CMD%
)

echo.
echo [6/6] LIMPIEZA...
del frontend.zip

echo.
echo ===================================================
echo        DESPLIEGUE FINALIZADO CON EXITO
echo ===================================================
echo Ahora verifica: http://saskipenguins.com/competiciones
echo.
pause
