@echo off
setlocal enabledelayedexpansion

:: Asegurar que el script corre desde su propia carpeta y no desde system32
cd /d "%~dp0"
title DESPLIEGUE DESDE GITHUB - SASKI PENGUINS
chcp 65001 > nul
cls

echo ========================================================
echo   INICIANDO DESPLIEGUE AUTOMATICO DESDE GITHUB (3X3)
echo ========================================================
echo.

:: --- 1. VERIFICACION DE REQUISITOS ---
echo [1/6] Verificando requisitos del sistema...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor, instala Node.js antes de ejecutar este script.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm no esta instalado o no se encuentra en el PATH.
    pause
    exit /b 1
)

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git no esta instalado o no se encuentra en el PATH.
    echo Para descargar el repositorio privado de GitHub, necesitas Git instalado.
    pause
    exit /b 1
)

echo [OK] Requisitos del sistema correctos.
echo.

:: --- 2. PREPARACION DE CARPETA TEMPORAL ---
echo [2/6] Preparando carpeta temporal de trabajo...
set "TEMP_DIR=%~dp0spbasket3x3_temp_deploy"

if exist "%TEMP_DIR%" (
    echo Limpiando restos de compilaciones anteriores...
    rmdir /s /q "%TEMP_DIR%"
)
echo.

:: --- 3. CLONAR REPOSITORIO DE GITHUB ---
echo [3/6] Descargando ultima version de GitHub...
echo Clonando repositorio...
git clone --depth 1 -b main https://github.com/jonamayuelas2-cell/spbasket3x3.git "%TEMP_DIR%"
if %errorlevel% neq 0 (
    echo ERROR: No se pudo clonar el repositorio de GitHub.
    echo Asegurate de tener conexion a internet y de estar autenticado en GitHub.
    echo Tambien verifica que el ordenador tenga los permisos y credenciales de Git necesarios.
    if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
    pause
    exit /b 1
)
echo [OK] Repositorio descargado con exito.
echo.

:: --- 4. COMPILAR EL FRONTEND ---
echo [4/6] Compilando la aplicacion Frontend (React)...
cd /d "%TEMP_DIR%\frontend"
if %errorlevel% neq 0 (
    echo ERROR: No se encontro la carpeta 'frontend'.
    goto cleanup_error
)

echo Instalando dependencias del Frontend (esto puede tardar unos instantes)...
call npm install --no-audit --no-fund --loglevel=error
if %errorlevel% neq 0 (
    echo ERROR: Fallo npm install en frontend.
    goto cleanup_error
)

echo Compilando Frontend (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion del Frontend.
    goto cleanup_error
)
echo [OK] Frontend compilado correctamente.
echo.

:: --- 5. EJECUTAR EL DESPLIEGUE AL VPS ---
echo [5/6] Subiendo archivos compilados al servidor VPS...
cd /d "%TEMP_DIR%\scratch\deploy"
if %errorlevel% neq 0 (
    echo ERROR: No se encontro la carpeta 'scratch\deploy'.
    goto cleanup_error
)

echo Instalando dependencias de despliegue...
call npm install --no-audit --no-fund --loglevel=error
if %errorlevel% neq 0 (
    echo ERROR: Fallo npm install en deploy.
    goto cleanup_error
)

echo Enviando frontend al VPS...
node deploy_vps_frontend.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo la subida del frontend al VPS.
    goto cleanup_error
)

echo Enviando backend al VPS y reiniciando PM2...
node deploy_vps_backend.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo la subida del backend o reinicio de PM2.
    goto cleanup_error
)
echo [OK] Despliegue en el servidor completado con exito.
echo.

:: --- 6. LIMPIEZA DE ARCHIVOS TEMPORALES ---
:cleanup_success
echo [6/6] Limpiando archivos temporales...
cd /d "%~dp0"
rmdir /s /q "%TEMP_DIR%"
echo [OK] Limpieza completada.
echo.
echo ========================================================
echo   DESPLIEGUE COMPLETADO Y CODIGO LIMPIADO CON EXITO
echo ========================================================
echo.
echo   Web 3x3:   https://saskipenguins.com/3x3
echo   Admin:     https://saskipenguins.com/3x3/admin
echo ========================================================
echo.
pause
exit /b 0

:cleanup_error
echo ADVERTENCIA: Limpiando carpeta temporal debido a un error...
cd /d "%~dp0"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
echo.
pause
exit /b 1
