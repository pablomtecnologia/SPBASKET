@echo off
set PASSWORD=Saskipenguins2o24@
set SERVER=root@94.143.142.26

echo === SUBIENDO SCRIPTS DE DATOS ===
echo Subiendo insert-parsed-db.js...
pscp -pw %PASSWORD% backend/insert-parsed-db.js %SERVER%:/var/www/spbasket/backend/
if %errorlevel% neq 0 ( exit /b %errorlevel% )

echo Subiendo parsed_manual_data.json...
pscp -pw %PASSWORD% backend/parsed_manual_data.json %SERVER%:/var/www/spbasket/backend/
if %errorlevel% neq 0 ( exit /b %errorlevel% )

echo.
echo === EJECUTANDO IMPORTACION EN SERVIDOR ===
plink -batch -pw %PASSWORD% %SERVER% "cd /var/www/spbasket/backend && node insert-parsed-db.js"

echo.
echo === DATA DEPLOY COMPLETE ===
pause
