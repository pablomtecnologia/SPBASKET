# Guía de Despliegue en VPS (IONOS) - SP Basket

Esta guía te permitirá desplegar tu proyecto (Frontend Angular + Backend Node.js + Base de Datos) en tu servidor VPS de IONOS.

## Requisitos Previos

1.  **Contraseña del Servidor**:
    *   Ve a tu panel de IONOS.
    *   En la sección "Datos de acceso", busca "Contraseña inicial".
    *   Haz clic en **"Mostrar contraseña"**. Copia esa contraseña y tenla a mano.

2.  **PowerShell**: Estas instrucciones asumen que usas Windows PowerShell (instalado por defecto).

## Pasos para Desplegar

He preparado scripts automáticos para hacer esto lo más sencillo posible.

### Paso 1: Preparar los Archivos (En tu PC)

1.  Abre PowerShell en la carpeta del proyecto (`c:\Users\pablo\Desktop\SPBASKET`).
2.  Ejecuta el script de preparación:
    ```powershell
    .\prepare_deploy.ps1
    ```
    *   Este script compilará tu web (Frontend) y preparará una carpeta llamada `deployment_temp` con todo lo necesario.
    *   Si hay errores en rojo, avísame. Si ves "BUILD SUCCESSFUL", continúa.

### Paso 2: Subir los Archivos al Servidor

El script anterior te habrá mostrado un comando comando `scp`. Ejecútalo para copiar los archivos. Será algo así:

```powershell
scp -r .\deployment_temp\* root@94.143.142.26:/root/
```

*   **Cuando te pida contraseña (`password:`)**: Escribe (o pega con clic derecho) la contraseña que obtuviste en el paso 1 (panel de IONOS).
*   *Nota: Al escribir la contraseña en la terminal, no verás asteriscos ni puntitos. Es normal. Escribe y pulsa Enter.*

### Paso 3: Instalar y Configurar el Servidor

1.  Conéctate al servidor por SSH:
    ```powershell
    ssh root@94.143.142.26
    ```
    *   Introduce de nuevo la contraseña.

2.  Una vez dentro (verás algo como `root@vps...:~#`), ejecuta estos comandos:

    ```bash
    chmod +x deploy_vps.sh
    ./deploy_vps.sh
    ```

    *   Este script instalará automáticamente:
        *   Node.js (Backend)
        *   PostgreSQL (Base de datos compatible con tu código actual)
        *   Nginx (Servidor Web)
        *   Creará la base de datos y el usuario administrador.
        *   Arrancará todo.

### Paso 4: Verificar

Una vez termine el script, abre tu navegador y visita:
`http://94.143.142.26/`

Deberías ver tu aplicación web funcionando.

---

## Notas Importantes

*   **Base de Datos**: Tu código Backend (`server.js`) está configurado para **PostgreSQL**, por lo que he configurado el servidor para usar Postgres en lugar de MySQL. El sistema creará las tablas automáticamente al arrancar.
*   **Usuario Admin**: Se ha creado el usuario `admin` / `admin@spbasket.com` con la contraseña predeterminada (del hash que tenías).
*   **Plesk**: Tu servidor tiene Plesk. Este despliegue manual podría entrar en conflicto si intentas usar Plesk para gestionar esta web al mismo tiempo. He configurado todo para que funcione de forma independiente. Si ves errores de "Port 80 busy", puede que Plesk esté interfiriendo. En ese caso, avísame.
