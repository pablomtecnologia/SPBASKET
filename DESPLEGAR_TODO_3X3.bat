@echo off
setlocal enabledelayedexpansion

:: Asegurar que el script corre desde su propia carpeta y no desde system32 o la del usuario
cd /d "%~dp0"
title DESPLIEGUE AUTOMÁTICO 3X3 - SASKI PENGUINS
chcp 65001 > nul
cls

echo ========================================================
echo   🚀 INICIANDO DESPLIEGUE EN CALIENTE - TORNEO 3X3
echo ========================================================
echo.

:: --- 1. VERIFICACIÓN DE REQUISITOS ---
echo [1/5] Verificando requisitos del sistema...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Node.js no está instalado o no se encuentra en el PATH.
    echo.
    echo 👉 Para subir los cambios, necesitas tener Node.js instalado en tu ordenador.
    echo    Por favor, descárgalo e instálalo desde: https://nodejs.org/
    echo    (Se recomienda la versión LTS). Una vez instalado, cierra esta ventana y vuelve a abrirla.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: npm (Node Package Manager) no está instalado o no se encuentra en el PATH.
    echo.
    echo 👉 Por favor, asegúrate de instalar Node.js completamente.
    echo.
    pause
    exit /b 1
)

echo ✔ Node.js y npm detectados correctamente.
echo.

:: --- 2. DETECCIÓN DINÁMICA DE CARPETAS ---
echo [2/5] Buscando carpetas del proyecto...

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

:: Localizar Frontend
set "FRONTEND_DIR="
if exist "%ROOT_DIR%\NUEVO_FRONTEND\frontend\package.json" (
    set "FRONTEND_DIR=%ROOT_DIR%\NUEVO_FRONTEND\frontend"
) else if exist "%ROOT_DIR%\frontend\package.json" (
    set "FRONTEND_DIR=%ROOT_DIR%\frontend"
) else if exist "%ROOT_DIR%\package.json" (
    set "FRONTEND_DIR=%ROOT_DIR%"
)

:: Localizar Carpeta de Despliegue
set "DEPLOY_DIR="
if exist "%ROOT_DIR%\scratch\deploy\deploy_vps_frontend.js" (
    set "DEPLOY_DIR=%ROOT_DIR%\scratch\deploy"
) else if exist "%ROOT_DIR%\deploy\deploy_vps_frontend.js" (
    set "DEPLOY_DIR=%ROOT_DIR%\deploy"
)

if not defined FRONTEND_DIR (
    echo.
    echo ❌ ERROR CRÍTICO: No se encontró la carpeta del frontend (debe contener 'package.json').
    echo    Asegúrate de que estás ejecutando el script desde la raíz de tu repositorio local.
    echo.
    pause
    exit /b 1
)

if not defined DEPLOY_DIR (
    echo.
    echo ❌ ERROR CRÍTICO: No se encontró la carpeta de scripts de despliegue ('scratch\deploy' o 'deploy').
    echo    Por favor, verifica que tengas todos los archivos del repositorio.
    echo.
    pause
    exit /b 1
)

echo ✔ Carpeta Frontend: !FRONTEND_DIR!
echo ✔ Carpeta Despliegue: !DEPLOY_DIR!
echo.

:: --- 3. GIT PULL (OPCIONAL) ---
echo [3/5] Sincronizando con el repositorio en la nube...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Git no está instalado o no se encuentra en el PATH. Se omitirá el paso de sincronización.
) else (
    echo Sincronizando cambios de Git...
    git pull
    if %errorlevel% neq 0 (
        echo.
        echo ⚠️  ADVERTENCIA: No se pudo hacer 'git pull'. Puede deberse a cambios locales sin guardar o falta de conexión.
        echo    El script continuará con el despliegue de tus archivos locales actuales de todas formas.
        echo.
    ) else (
        echo ✔ Repositorio local sincronizado con éxito.
    )
)
echo.

:: --- 4. INSTALACIÓN Y COMPILACIÓN DEL FRONTEND ---
echo [4/5] Compilando la aplicación de React (Frontend)...
cd /d "!FRONTEND_DIR!"

echo Instalando dependencias de frontend (esto puede tardar la primera vez)...
call npm install --no-audit --no-fund --loglevel=error
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Falló la instalación de dependencias del Frontend (npm install).
    echo.
    pause
    exit /b %errorlevel%
)

echo Compilando Frontend (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: La compilación del Frontend falló. Revisa que no haya errores de sintaxis en tu código.
    echo.
    pause
    exit /b %errorlevel%
)
echo ✔ Frontend compilado correctamente.
echo.

:: --- 5. EJECUCIÓN DEL DESPLIEGUE AL SERVIDOR ---
echo [5/5] Subiendo archivos al servidor VPS...
cd /d "!DEPLOY_DIR!"

echo Instalando dependencias de despliegue...
call npm install --no-audit --no-fund --loglevel=error
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Falló la instalación de dependencias de despliegue.
    echo.
    pause
    exit /b %errorlevel%
)

echo Enviando frontend compilado al servidor vía SFTP...
node deploy_vps_frontend.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo subir el frontend al servidor VPS.
    echo    Por favor, comprueba tu conexión a internet o si el servidor está caído.
    echo.
    pause
    exit /b %errorlevel%
)

echo Enviando backend al servidor y reiniciando procesos (PM2)...
node deploy_vps_backend.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Falló la subida del backend o el reinicio de PM2.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo   🎉 ¡DESPLIEGUE COMPLETADO CON ÉXITO DESDE TU PC!
echo ========================================================
echo.
echo   🌐 Web 3x3:   https://saskipenguins.com/3x3
echo   🔑 Admin:     https://saskipenguins.com/3x3/admin
echo.
echo ========================================================
echo.
pause
