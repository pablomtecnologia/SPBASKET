@echo off
setlocal enabledelayedexpansion

set PASSWORD=Saskipenguins2o24@
set SERVER=root@94.143.142.26

echo === COMPILANDO FRONTEND ===
cd sp-basket
call npm run build
if %errorlevel% neq 0 (
    echo ERROR EN BUILD
    pause
    exit /b 1
)
cd ..

echo.
echo === CREANDO PAQUETE ===
powershell -Command "Compress-Archive -Path 'sp-basket\dist\sp-basket\browser\*' -DestinationPath 'frontend-deploy-new.zip' -Force"

echo.
echo === SUBIENDO ARCHIVOS ===
echo IMPORTANTE: Cuando pida password, escribe: %PASSWORD%
echo.

pscp -pw %PASSWORD% frontend-deploy-new.zip %SERVER%:/tmp/
pscp -pw %PASSWORD% backend\server.js %SERVER%:/tmp/

echo.
echo === DESCOMPRIMIENDO EN SERVIDOR ===
plink -batch -pw %PASSWORD% %SERVER% "cd /tmp && unzip -o frontend-deploy-new.zip -d /var/www/html/ && cp server.js /var/www/spbasket/backend/ && pm2 restart all"

echo.
echo === LIMPIANDO ===
del frontend-deploy-new.zip

echo.
echo ========================================
echo   DESPLIEGUE COMPLETADO CON EXITO
echo ========================================
pause
