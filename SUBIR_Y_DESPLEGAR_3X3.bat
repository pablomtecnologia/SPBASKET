@echo off
setlocal enabledelayedexpansion

:: Asegurar que el script corre desde su propia carpeta y no desde system32
cd /d "%~dp0"
title SINCRONIZAR Y DESPLEGAR 3X3 - SASKI PENGUINS
chcp 65001 > nul
cls

echo ========================================================
echo   SINCRONIZAR CON GITHUB Y DESPLEGAR AL VPS (3X3)
echo ========================================================
echo.

:: --- 1. VERIFICACION DE GIT ---
echo [1/4] Verificando Git en el sistema...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git no esta instalado o no se encuentra en el PATH.
    echo Este script necesita Git para subir los cambios a GitHub.
    pause
    exit /b 1
)
echo [OK] Git detectado correctamente.
echo.

:: --- 2. SOLICITAR MENSAJE DE COMMIT ---
echo [2/4] Preparando cambios locales...
git status -s

echo.
set "COMMIT_MSG="
set /p "COMMIT_MSG=Introduce un comentario para tus cambios (pulsa Enter para usar comentario por defecto): "

if not defined COMMIT_MSG (
    set "COMMIT_MSG=Actualizacion automatica de codigo y despliegue"
)

echo.
echo Guardando cambios locales...
git add .
git commit -m "!COMMIT_MSG!"
if %errorlevel% neq 0 (
    echo.
    echo Info: No se detectaron cambios locales nuevos para confirmar.
)
echo.

:: --- 3. SUBIR A GITHUB (DETECCION DE REMOTE) ---
echo [3/4] Subiendo cambios a GitHub...

:: Detectar remotas de git
set "REMOTE_NAME=origin"
git remote | findstr /i "jon" >nul 2>&1
if %errorlevel% eq 0 (
    set "REMOTE_NAME=jon"
)

echo Subiendo cambios a la rama principal (main) de GitHub en el remote '!REMOTE_NAME!'...
git push !REMOTE_NAME! main
if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudieron subir los cambios a GitHub.
    echo Asegurate de tener conexion a internet y permisos de escritura en el repositorio.
    pause
    exit /b 1
)
echo [OK] Cambios subidos correctamente a GitHub.
echo.

:: --- 4. LANZAR EL DESPLIEGUE DESDE GITHUB ---
echo [4/4] Iniciando despliegue automatico en el servidor VPS...
echo Lanzando script de despliegue desde GitHub...
echo.

if exist "DESPLEGAR_DESDE_GITHUB.bat" (
    call DESPLEGAR_DESDE_GITHUB.bat
) else (
    echo ERROR: No se encontro el archivo DESPLEGAR_DESDE_GITHUB.bat en esta carpeta.
    pause
    exit /b 1
)

exit /b 0
