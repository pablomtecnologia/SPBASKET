@echo off
echo ==========================================
echo    RESTAURANDO ACCESO AUTOMATICO (SSH)
echo ==========================================
echo.

:: 1. Generar llave si no existe
if not exist "C:\Users\pablo\.ssh\id_rsa" (
    echo Generando nueva llave SSH...
    mkdir "C:\Users\pablo\.ssh" >nul 2>&1
    ssh-keygen -t rsa -b 4096 -fC:\Users\pablo\.ssh\id_rsa -N ""
) else (
    echo Llave SSH ya existe.
)

:: 2. Leer la llave publica
set /p PUBKEY=<"C:\Users\pablo\.ssh\id_rsa.pub"

:: 3. Instalar en el servidor y reparar dependencias
echo.
echo =======================================================
echo AHORA TE PEDIRA LA CONTRASENA DEL SERVIDOR UNA VEZ.
echo Escribela: Saskipenguins2o24@
echo (No se veran los caracteres al escribir)
echo =======================================================
echo.
echo Instalando llave y reparando servidor...
ssh root@94.143.142.26 "mkdir -p ~/.ssh && echo %PUBKEY% >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && cd /var/www/spbasket/backend && npm install helmet express-rate-limit && pm2 restart all"

echo.
echo ==========================================
echo    PROCESO COMPLETADO
echo ==========================================
pause
