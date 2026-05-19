@echo off
:: Asegurar que el script corre desde su propia carpeta y no desde system32 o la del usuario
cd /d "%~dp0"
title subiendo 3x3
chcp 65001 > nul
cls

echo === SUBIENDO ESTO RAPIDOOO ===
echo.

:: 1. GIT PULL
echo bajando de git...
git pull
if %errorlevel% neq 0 (
    echo [!] falló el pull, pero sigo igual...
) else (
    echo [ok] pull listo
)
echo.

:: 2. COMPILAR
echo compilandoo react...
cd NUEVO_FRONTEND\frontend
call npm install --no-audit --no-fund --loglevel=error
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [X] peto al compilar frote...
    pause
    exit /b %errorlevel%
)
cd ..\..
echo [ok] compilado bien
echo.

:: 3. SUBIR FRONT
echo subiendo front al vps...
cd scratch\deploy
call npm install --no-audit --no-fund --loglevel=error
node deploy_vps_frontend.js
if %errorlevel% neq 0 (
    echo.
    echo [X] no subio el front al vps
    cd ..\..
    pause
    exit /b %errorlevel%
)
echo [ok] front subidooo!
echo.

:: 4. SUBIR BACK
echo subiendo back y reseteando pm2...
node deploy_vps_backend.js
if %errorlevel% neq 0 (
    echo.
    echo [X] peto el back o pm2
    cd ..\..
    pause
    exit /b %errorlevel%
)
cd ..\..
echo [ok] pm2 reiniciadooo
echo.

echo === LISTOOO Y SUBIDOOO EN CALIENTEEE ===
echo web: https://saskipenguins.com/3x3
echo admin: https://saskipenguins.com/3x3/admin
echo ====================================
echo.
pause
