:: Script de sincronización y despliegue del Torneo 3x3 (React y Node)
@echo off
setlocal enabledelayedexpansion

:: Asegurar que el script corre desde su propia carpeta y no desde system32
cd /d "%~dp0"
title SINCRONIZAR Y DESPLEGAR 3X3 - SASKI PENGUINS
chcp 65001 > nul
cls

echo ========================================================
echo   SINCRONIZAR CON GITHUB Y DESPLEGAR TORNEO 3X3
echo ========================================================
echo (Este script solo afecta al Torneo 3x3. La web principal
echo  Angular y su backend permaneceran intactos sin cambios).
echo ========================================================
echo.

:: --- 1. VERIFICACION DE GIT ---
echo [1/5] Verificando Git en el sistema...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git no esta instalado o no se encuentra en el PATH.
    echo Este script necesita Git para subir los cambios a GitHub.
    pause
    exit /b 1
)
echo OK: Git detectado correctamente.
echo.

:: --- 2. PREPARAR Y CONFIRMAR CAMBIOS LOCALES ---
echo [2/5] Preparando cambios locales de Git...
git add .

echo.
echo Estado actual de los archivos modificados y nuevos del torneo:
git status -s
echo.

set "COMMIT_MSG="
set /p "COMMIT_MSG=Introduce un comentario para tus cambios (Enter para usar el comentario por defecto): "

if not defined COMMIT_MSG (
    set "COMMIT_MSG=Actualizacion de codigo y novedades del torneo 3x3"
)

echo Guardando cambios localmente en Git...
git commit -m "!COMMIT_MSG!"
if %errorlevel% neq 0 (
    echo Info: No se detectaron cambios locales nuevos para confirmar.
)
echo.

:: --- 3. SELECCIONAR REMOTE Y HACER PUSH ---
echo [3/5] Sincronizando con el repositorio en GitHub...
echo.
echo Remotos disponibles:
git remote -v
echo.

set "REMOTE_NAME=origin"
git remote | findstr /i "jon" >nul 2>&1
if %errorlevel% eq 0 (
    echo Se ha detectado el repositorio de Jon (jon) y el tuyo (origin).
    set /p "REMOTE_NAME=Introduce el nombre del remoto al que quieres subir [Enter para 'origin']: "
)

if not defined REMOTE_NAME (
    set "REMOTE_NAME=origin"
)

:: Obtener la rama actual dinamicamente
set "BRANCH_NAME=main"
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH_NAME=%%i"

echo Subiendo cambios al remote '!REMOTE_NAME!' en la rama '!BRANCH_NAME!'...
git push !REMOTE_NAME! !BRANCH_NAME!
if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudieron subir los cambios a GitHub.
    echo Verifica tu conexion a internet y permisos de escritura.
    pause
    exit /b 1
)
echo OK: Cambios sincronizados con éxito en GitHub.
echo.

:: --- 4. COMPILAR EL FRONTEND DEL TORNEO 3X3 ---
echo [4/5] Compilando el Frontend del Torneo 3x3 (React)...

:: Localizar la carpeta frontend del 3x3 dinamicamente
set "FRONTEND_3X3_DIR="
if exist "%~dp0NUEVO_FRONTEND\frontend\package.json" (
    set "FRONTEND_3X3_DIR=%~dp0NUEVO_FRONTEND\frontend"
) else if exist "%~dp0frontend\package.json" (
    set "FRONTEND_3X3_DIR=%~dp0frontend"
)

if not defined FRONTEND_3X3_DIR (
    echo ERROR: No se encontro la carpeta de frontend del torneo 3x3.
    pause
    exit /b 1
)

echo Accediendo a la carpeta del frontend 3x3: !FRONTEND_3X3_DIR!
cd /d "!FRONTEND_3X3_DIR!"

echo Instalando dependencias de React si falta alguna...
call npm install --no-audit --no-fund --loglevel=error

echo Compilando Frontend React (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion del Frontend React.
    cd /d "%~dp0"
    pause
    exit /b 1
)
cd /d "%~dp0"
echo OK: Frontend React compilado correctamente.
echo.

:: --- 5. EJECUTAR EL DESPLIEGUE SEGURO AL VPS ---
echo [5/5] Subiendo frontend y backend del Torneo 3x3 al servidor VPS...
cd /d "%~dp0scratch\deploy"

echo Instalando dependencias de los scripts de despliegue si falta alguna...
call npm install --no-audit --no-fund --loglevel=error

echo Enviando frontend del Torneo 3x3 a /var/www/html/3x3...
node deploy_vps_frontend.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo al subir el frontend 3x3 al VPS.
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Enviando backend del Torneo 3x3 y reiniciando PM2 (proceso spbasket-3x3)...
node deploy_vps_backend.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo al subir el backend 3x3 o reiniciar PM2.
    cd /d "%~dp0"
    pause
    exit /b 1
)

cd /d "%~dp0"
echo.
echo ========================================================
echo   ?? ¡PROCESO COMPLETADO CON EXITO DESDE TU PC!
echo ========================================================
echo.
echo   El Torneo 3x3 esta actualizado e independiente en:
echo   ?? Web 3x3:   https://saskipenguins.com/3x3
echo   ?? Admin:     https://saskipenguins.com/3x3/admin
echo.
echo   (Tu web de Angular y su backend no han sido alterados).
echo ========================================================
echo.
pause
