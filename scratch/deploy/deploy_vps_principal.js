const Client = require('ssh2-sftp-client');
const { Client: SSHClient } = require('ssh2');
const path = require('path');
const fs = require('fs');

const config = {
  host: '94.143.142.26',
  port: 22,
  username: 'root',
  password: 'Saskipenguins2o24@'
};

async function deploy() {
  const sftp = new Client();
  const rootDir = path.resolve(__dirname, '../..');
  
  // 1. Verificar carpetas locales
  const localFrontendDir = path.join(rootDir, 'sp-basket/dist/sp-basket/browser');
  if (!fs.existsSync(localFrontendDir)) {
    console.error(`Error: No se encontró el frontend compilado en: ${localFrontendDir}`);
    console.error('Por favor, compila el frontend de Angular ejecutando "npm run build" dentro de la carpeta "sp-basket" primero.');
    process.exit(1);
  }

  try {
    console.log('Conectando al VPS de Saski Penguins vía SFTP...');
    await sftp.connect(config);
    console.log('¡Conectado vía SFTP correctamente!');

    // 2. Limpieza selectiva del Frontend en el VPS
    const remoteFrontendDir = '/var/www/html';
    console.log(`Limpiando selectivamente el directorio frontend: ${remoteFrontendDir} (excluyendo "3x3")...`);
    
    const list = await sftp.list(remoteFrontendDir);
    for (const item of list) {
      // EXCLUIR por completo la carpeta "3x3"
      if (item.name === '3x3') {
        console.log('-> Omitiendo y preservando la carpeta del Torneo 3x3');
        continue;
      }
      
      const itemPath = `${remoteFrontendDir}/${item.name}`;
      if (item.type === '-') {
        await sftp.delete(itemPath);
      } else if (item.type === 'd' && item.name !== '.' && item.name !== '..') {
        await sftp.rmdir(itemPath, true);
      }
    }
    console.log('✔ Limpieza selectiva completada.');

    // 3. Subir el Frontend de Angular
    console.log(`Subiendo frontend de Angular desde ${localFrontendDir} a ${remoteFrontendDir}...`);
    await sftp.uploadDir(localFrontendDir, remoteFrontendDir);
    console.log('✔ Frontend de Angular subido con éxito.');

    // 4. Subir archivos de Backend
    const remoteBackendDir = '/var/www/spbasket/backend';
    console.log(`Verificando/Creando carpeta de backend en VPS: ${remoteBackendDir}`);
    if (!(await sftp.exists(remoteBackendDir))) {
      await sftp.mkdir(remoteBackendDir, true);
    }

    const backendFiles = [
      'server.js',
      'live-scraper.js',
      'scraper-fecan.js',
      'fecan-auto-scraper.js',
      'package.json'
    ];

    for (const file of backendFiles) {
      const localFilePath = path.join(rootDir, 'backend', file);
      const remoteFilePath = `${remoteBackendDir}/${file}`;
      if (fs.existsSync(localFilePath)) {
        console.log(`Subiendo script de backend: ${file}...`);
        await sftp.fastPut(localFilePath, remoteFilePath);
      } else {
        console.log(`Advertencia: No se encontró el archivo local ${localFilePath}, omitiendo.`);
      }
    }
    console.log('✔ Archivos de backend subidos con éxito.');

  } catch (err) {
    console.error('Error durante la transferencia SFTP:', err);
    process.exit(1);
  } finally {
    await sftp.end();
    console.log('Conexión SFTP cerrada.');
  }

  // 5. Ejecutar comandos SSH para instalar dependencias y reiniciar PM2
  console.log('Estableciendo conexión SSH para configurar backend y reiniciar PM2...');
  const conn = new SSHClient();
  conn.on('ready', () => {
    console.log('Conexión SSH lista.');
    const cmd = 'cd /var/www/spbasket/backend && npm install playwright cheerio && npx playwright install chromium --with-deps && pm2 restart server';
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('Error al ejecutar comandos en el servidor:', err);
        conn.end();
        process.exit(1);
      }
      
      stream.on('close', (code, signal) => {
        console.log(`Comando SSH finalizado con código: ${code}`);
        conn.end();
        console.log('\n======================================================');
        console.log(' 🎉 ¡DESPLIEGUE DE SPBASKET PRINCIPAL COMPLETADO!');
        console.log('======================================================\n');
        process.exit(0);
      }).on('data', (data) => {
        process.stdout.write('STDOUT: ' + data);
      }).stderr.on('data', (data) => {
        process.stderr.write('STDERR: ' + data);
      });
    });
  }).connect(config);
}

deploy();
