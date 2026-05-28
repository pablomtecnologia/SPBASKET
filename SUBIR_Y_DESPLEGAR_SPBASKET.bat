@echo off
setlocal enabledelayedexpansion

:: Asegurar que el script corre desde su propia carpeta y no desde system32
cd /d "%~dp0"
title SINCRONIZAR Y DESPLEGAR - SASKI PENGUINS
chcp 65001 > nul
cls

echo ========================================================
2: echo   SISTEMA DE DESPLIEGUE Y SINCRONIZACION DE SPBASKET
3: echo ========================================================
echo.
echo Selecciona la opcion que deseas realizar:
echo.
echo [1] Subir cambios a GitHub y Desplegar Web Principal (Angular)
echo [2] Subir cambios a GitHub y Desplegar Torneo 3x3 (React)
echo [3] Subir cambios a GitHub y Desplegar Ambos Sistemas (Principal + 3x3)
echo [4] Solo subir cambios a GitHub (Sin desplegar en el servidor)
echo [5] Solo desplegar Web Principal (Sin subir a GitHub)
echo [6] Solo desplegar Torneo 3x3 (Sin subir a GitHub)
echo [7] Salir
echo.

set "OPCION="
set /p "OPCION=Introduce el numero de tu opcion [1-7]: "

if "%OPCION%"=="1" goto git_section
if "%OPCION%"=="2" goto git_section
if "%OPCION%"=="3" goto git_section
if "%OPCION%"=="4" goto git_section
if "%OPCION%"=="5" goto deploy_principal
if "%OPCION%"=="6" goto deploy_3x3
if "%OPCION%"=="7" goto end_script

echo Opcion no valida. Intentalo de nuevo.
pause
goto :EOF

:git_section
echo.
echo ========================================================
echo   1. PROCESANDO CAMBIOS Y SUBIENDO A GITHUB
echo ========================================================
echo.

:: --- VERIFICACION DE GIT ---
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git no esta instalado o no se encuentra en el PATH.
    echo Este script necesita Git para subir los cambios a GitHub.
    pause
    goto :EOF
)

:: Obtener la rama actual dinamicamente
set "BRANCH_NAME=main"
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH_NAME=%%i"
echo Rama de trabajo actual detectada: !BRANCH_NAME!

:: Agregar archivos locales
echo Agregando cambios al indice de Git...
git add .

echo.
echo Estado actual de tus archivos modificados y nuevos:
git status -s
echo.

set "COMMIT_MSG="
set /p "COMMIT_MSG=Introduce un comentario para tus cambios (Enter para usar el comentario por defecto): "

if not defined COMMIT_MSG (
    set "COMMIT_MSG=Actualizacion automatica de codigo y novedades"
)

echo Guardando cambios localmente...
git commit -m "!COMMIT_MSG!"
if %errorlevel% neq 0 (
    echo Info: No se detectaron cambios locales nuevos para confirmar.
)

:: Subir a origin (GitHub de Pablo)
echo.
echo Subiendo cambios a GitHub (repositorio de Pablo en remote origin, rama !BRANCH_NAME!)...
git push origin !BRANCH_NAME!
if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudieron subir los cambios a GitHub.
    echo Verifica tu conexion a internet y permisos de escritura.
    pause
    goto :EOF
)
echo OK: Cambios subidos correctamente a GitHub.
echo.

:: Redireccionar segun la opcion seleccionada
if "%OPCION%"=="1" goto deploy_principal
if "%OPCION%"=="2" goto deploy_3x3
if "%OPCION%"=="3" goto deploy_ambos
if "%OPCION%"=="4" goto deploy_only_git
goto end_script

:deploy_principal
echo.
echo ========================================================
echo   2. COMPILANDO Y DESPLEGANDO WEB PRINCIPAL (ANGULAR)
echo ========================================================
echo.

if not exist "%~dp0sp-basket\package.json" (
    echo ERROR: No se encontro la carpeta de la web principal 'sp-basket'.
    pause
    goto :EOF
)

echo Accediendo a la carpeta sp-basket...
cd /d "%~dp0sp-basket"

echo Instalando dependencias de Angular si falta alguna...
call npm install --no-audit --no-fund --loglevel=error

echo Compilando aplicacion Angular (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion del Frontend Angular.
    cd /d "%~dp0"
    pause
    goto :EOF
)
cd /d "%~dp0"
echo OK: Frontend compilado correctamente.
echo.

echo Iniciando subida de archivos al servidor VPS...
cd /d "%~dp0scratch\deploy"
call npm install --no-audit --no-fund --loglevel=error
node deploy_vps_principal.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo la subida o configuracion en el servidor.
    cd /d "%~dp0"
    pause
    goto :EOF
)
cd /d "%~dp0"

if "%OPCION%"=="3" goto deploy_3x3
goto end_script

:deploy_3x3
echo.
echo ========================================================
echo   3. COMPILANDO Y DESPLEGANDO TORNEO 3X3 (REACT)
echo ========================================================
echo.

:: Localizar Frontend 3x3 dinamicamente
set "FRONTEND_3X3_DIR="
if exist "%~dp0NUEVO_FRONTEND\frontend\package.json" (
    set "FRONTEND_3X3_DIR=%~dp0NUEVO_FRONTEND\frontend"
) else if exist "%~dp0frontend\package.json" (
    set "FRONTEND_3X3_DIR=%~dp0frontend"
)

if not defined FRONTEND_3X3_DIR (
    echo ERROR: No se encontro la carpeta de frontend del torneo 3x3.
    pause
    goto :EOF
)

echo Carpeta de frontend del 3x3 encontrada en: !FRONTEND_3X3_DIR!
cd /d "!FRONTEND_3X3_DIR!"

echo Instalando dependencias de React si falta alguna...
call npm install --no-audit --no-fund --loglevel=error

echo Compilando Frontend React (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion del Frontend React.
    cd /d "%~dp0"
    pause
    goto :EOF
)
cd /d "%~dp0"
echo OK: Frontend React compilado correctamente.
echo.

echo Iniciando subida de frontend y backend 3x3 al servidor VPS...
cd /d "%~dp0scratch\deploy"
call npm install --no-audit --no-fund --loglevel=error

echo Subiendo Frontend 3x3...
node deploy_vps_frontend.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo al subir el frontend 3x3 al servidor.
    cd /d "%~dp0"
    pause
    goto :EOF
)

echo Subiendo Backend 3x3 y reiniciando PM2...
node deploy_vps_backend.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo al subir el backend 3x3 o reiniciar PM2.
    cd /d "%~dp0"
    pause
    goto :EOF
)
cd /d "%~dp0"
goto end_script

:deploy_ambos
:: Ya cubierto por la transicion automatica desde deploy_principal a deploy_3x3 si OPCION=3
goto end_script

:deploy_only_git
echo.
echo ========================================================
echo   PROCESO COMPLETADO: CAMBIOS SUBIDOS A GITHUB
echo ========================================================
echo Se han subido todos los cambios a tu repositorio de GitHub.
echo.
pause
goto :EOF

:end_script
echo.
echo ========================================================
echo   ¡PROCESO FINALIZADO CON EXITO!
echo ========================================================
echo.
echo   Web Principal: http://saskipenguins.com/
echo   Torneo 3x3:    https://saskipenguins.com/3x3
echo.
echo ========================================================
echo.
pause
