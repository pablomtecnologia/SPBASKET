const Client = require('ssh2-sftp-client');
const path = require('path');

async function deploy() {
  const sftp = new Client();
  const config = {
    host: '94.143.142.26',
    port: 22,
    username: 'root',
    password: 'Saskipenguins2o24@'
  };

  try {
    console.log('Conectando al VPS de Saski Penguins...');
    await sftp.connect(config);
    console.log('¡Conectado con éxito al VPS!');

    const fs = require('fs');
    const rootDir = path.resolve(__dirname, '../..');
    
    let localDir = '';
    if (fs.existsSync(path.join(rootDir, 'NUEVO_FRONTEND/frontend/dist'))) {
      localDir = path.join(rootDir, 'NUEVO_FRONTEND/frontend/dist');
    } else if (fs.existsSync(path.join(rootDir, 'frontend/dist'))) {
      localDir = path.join(rootDir, 'frontend/dist');
    } else {
      throw new Error("No se encontró la carpeta 'dist' del frontend compilado en ninguna de las rutas.");
    }

    const remoteDir = '/var/www/html/3x3';

    // Asegurarse de que el directorio remoto existe
    console.log(`Verificando/Creando directorio remoto: ${remoteDir}`);
    const exists = await sftp.exists(remoteDir);
    if (!exists) {
      await sftp.mkdir(remoteDir, true);
      console.log('Directorio creado.');
    } else {
      console.log('El directorio ya existe. Limpiándolo antes de subir...');
      // Podemos listar y vaciar para evitar acumulación de archivos viejos
      const files = await sftp.list(remoteDir);
      for (const file of files) {
        const filePath = `${remoteDir}/${file.name}`;
        if (file.type === '-') {
          await sftp.delete(filePath);
        } else if (file.type === 'd' && file.name !== '.' && file.name !== '..') {
          await sftp.rmdir(filePath, true);
        }
      }
    }

    console.log(`Subiendo recursivamente ${localDir} a ${remoteDir}...`);
    
    // uploadDir de ssh2-sftp-client sube recursivamente la carpeta
    const result = await sftp.uploadDir(localDir, remoteDir);
    console.log('¡Frontend subido con éxito al VPS!');
    console.log(result);

  } catch (err) {
    console.error('Error durante el despliegue SFTP en VPS:', err);
  } finally {
    await sftp.end();
    console.log('Conexión SFTP cerrada.');
  }
}

deploy();
