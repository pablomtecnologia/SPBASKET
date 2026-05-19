const Client = require('ssh2-sftp-client');
const path = require('path');

async function deploy() {
  const sftp = new Client();
  const config = {
    host: 'access-5017181970.webspace-host.com',
    port: 22,
    username: 'a1406158',
    password: 'Saskipenguins2o24@'
  };

  try {
    console.log('Conectando a IONOS SFTP...');
    await sftp.connect(config);
    console.log('¡Conectado con éxito!');

    // Listar contenido actual para verificar el directorio
    console.log('Listando el directorio remoto actual:');
    const fileList = await sftp.list('.');
    console.log(JSON.stringify(fileList, null, 2));

    const localDir = 'c:/Users/pablo/Desktop/SPBASKET/NUEVO_FRONTEND/frontend/dist';
    const remoteDir = '.';

    console.log(`Subiendo recursivamente ${localDir} a ${remoteDir}...`);
    
    // uploadDir de ssh2-sftp-client sube recursivamente la carpeta
    const result = await sftp.uploadDir(localDir, remoteDir);
    console.log('¡Subida completada con éxito!');
    console.log(result);

  } catch (err) {
    console.error('Error durante el despliegue SFTP:', err);
  } finally {
    await sftp.end();
    console.log('Conexión SFTP cerrada.');
  }
}

deploy();
