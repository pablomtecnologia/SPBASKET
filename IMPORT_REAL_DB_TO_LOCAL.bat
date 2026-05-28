@echo off
setlocal enabledelayedexpansion

:: CONFIGURACION
set PG_BIN=C:\Program Files\PostgreSQL\16\bin
set DB_NAME=spbasket
set BACKUP_FILE=C:\Users\pablo\Desktop\SPBASKET_BACKUP_20260214\spbasket_full.sql

echo ======================================================
echo    IMPORTANDO BASE DE DATOS REAL A LOCAL
echo ======================================================
echo.

:: Verificar si existe el archivo de backup
if not exist "%BACKUP_FILE%" (
    echo [ERROR] No se encuentra el archivo: %BACKUP_FILE%
    echo Revisa la fecha de la carpeta en tu escritorio.
    pause
    exit /b 1
)

:: Verificar si existe PostgreSQL
if not exist "%PG_BIN%\psql.exe" (
    echo [AVISO] No he encontrado PostgreSQL en la ruta por defecto.
    echo Intentando buscarla...
    for /d %%i in ("C:\Program Files\PostgreSQL\*") do (
        if exist "%%i\bin\psql.exe" (
            set PG_BIN=%%i\bin
            echo [OK] Encontrado en: !PG_BIN!
        )
    )
)

echo Usando: %PG_BIN%
echo.
echo 1. Borrando base de datos antigua (si existe)...
"%PG_BIN%\dropdb.exe" -U postgres %DB_NAME% --if-exists

echo 2. Creando base de datos limpia...
"%PG_BIN%\createdb.exe" -U postgres %DB_NAME%

echo 3. Importando datos reales...
echo (Si pide contraseña, usa la de tu base de datos local)
"%PG_BIN%\psql.exe" -U postgres -d %DB_NAME% -f "%BACKUP_FILE%"

echo.
echo ======================================================
echo    ¡PROCESO COMPLETADO!
echo ======================================================
echo.
pause
