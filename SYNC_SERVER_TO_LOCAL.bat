@echo off
setlocal enabledelayedexpansion

:: CONFIGURACION
set SERVER=root@94.143.142.26
set REMOTE_BACKEND=/var/www/spbasket/backend
set LOCAL_BACKUP_DIR=%USERPROFILE%\Desktop\SPBASKET_BACKUP_%DATE:~-4%%DATE:~3,2%%DATE:~0,2%

echo ======================================================
echo    DESCARGANDO TODO DEL SERVIDOR (BACKUP COMPLETO)
echo ======================================================
echo.
echo 1. Creando carpeta en el escritorio: %LOCAL_BACKUP_DIR%
mkdir "%LOCAL_BACKUP_DIR%" 2>nul
mkdir "%LOCAL_BACKUP_DIR%\uploads" 2>nul

echo 2. Generando copia de la Base de Datos en el servidor...
ssh %SERVER% "cd /tmp && sudo -u postgres pg_dump spbasket > spbasket_full.sql"

echo 3. Comprimiendo imagenes de subidas (uploads)...
ssh %SERVER% "tar -czf /tmp/uploads_backup.tar.gz -C %REMOTE_BACKEND% uploads"

echo 4. Descargando archivos al ordenador...
scp %SERVER%:/tmp/spbasket_full.sql "%LOCAL_BACKUP_DIR%"
scp %SERVER%:/tmp/uploads_backup.tar.gz "%LOCAL_BACKUP_DIR%"
scp %SERVER%:%REMOTE_BACKEND%/.env "%LOCAL_BACKUP_DIR%\server.env"
scp %SERVER%:%REMOTE_BACKEND%/server.js "%LOCAL_BACKUP_DIR%"

echo 5. Descomprimiendo imagenes localmente...
powershell -Command "tar -xzf '%LOCAL_BACKUP_DIR%\uploads_backup.tar.gz' -C '%LOCAL_BACKUP_DIR%'"

echo 6. Limpiando archivos temporales en el servidor...
ssh %SERVER% "rm /tmp/spbasket_full.sql /tmp/uploads_backup.tar.gz"

echo.
echo ======================================================
echo    ¡HECHO! Todo esta en: %LOCAL_BACKUP_DIR%
echo ======================================================
echo.
echo PROXIMOS PASOS PARA TENERLO IGUAL EN LOCAL:
echo 1. Copia los archivos de la carpeta 'uploads' a tu carpeta backend/uploads local.
echo 2. Importa 'spbasket_full.sql' en tu PostgreSQL local.
echo 3. Usa los valores de 'server.env' en tu .env local (cuidado con el host de la DB).
echo.
pause
