const Client = require('ssh2-sftp-client');
const { Client: SSHClient } = require('ssh2');

const config = {
  host: '94.143.142.26',
  port: 22,
  username: 'root',
  password: 'Saskipenguins2o24@'
};

async function deploy() {
  const sftp = new Client();
  
  try {
    console.log('Conectando al VPS vía SFTP...');
    await sftp.connect(config);
    console.log('¡Conectado vía SFTP con éxito!');

    const fs = require('fs');
    const path = require('path');
    const rootDir = path.resolve(__dirname, '../..');

    let localFile = '';
    if (fs.existsSync(path.join(rootDir, 'NUEVO_BACKEND/backend/src/index.js'))) {
      localFile = path.join(rootDir, 'NUEVO_BACKEND/backend/src/index.js');
    } else if (fs.existsSync(path.join(rootDir, 'backend/src/index.js'))) {
      localFile = path.join(rootDir, 'backend/src/index.js');
    } else {
      throw new Error("No se encontró el archivo 'index.js' del backend en ninguna de las rutas.");
    }

    const remoteFile = '/var/www/spbasket-3x3/backend/src/index.js';

    console.log(`Subiendo ${localFile} a ${remoteFile}...`);
    await sftp.fastPut(localFile, remoteFile);
    console.log('¡index.js subido con éxito al VPS!');

  } catch (err) {
    console.error('Error durante la subida por SFTP:', err);
    return;
  } finally {
    await sftp.end();
  }

  // Ahora conectar vía SSH normal para reiniciar PM2
  console.log('Estableciendo conexión SSH para reiniciar PM2...');
  const conn = new SSHClient();
  conn.on('ready', () => {
    console.log('Conexión SSH lista.');
    conn.exec('pm2 restart spbasket-3x3', (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`Comando PM2 finalizado con código de salida: ${code}`);
        conn.end();
      }).on('data', (data) => {
        console.log('STDOUT: ' + data);
      }).stderr.on('data', (data) => {
        console.error('STDERR: ' + data);
      });
    });
  }).connect(config);
}

deploy();
