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

async function executeSSHCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      }).on('data', (data) => {
        stdout += data.toString();
      }).stderr.on('data', (data) => {
        stderr += data.toString();
      });
    });
  });
}

async function deploy() {
  const rootDir = path.resolve(__dirname, '../..');
  
  // 1. Verificar carpetas locales
  const localFrontendDir = path.join(rootDir, 'sp-basket/dist/sp-basket/browser');
  if (!fs.existsSync(localFrontendDir)) {
    console.error(`Error: No se encontró el frontend compilado en: ${localFrontendDir}`);
    console.error('Por favor, compila el frontend de Angular ejecutando "npm run build" dentro de la carpeta "sp-basket" primero.');
    process.exit(1);
  }

  const conn = new SSHClient();
  
  console.log('Estableciendo conexión SSH con el servidor para limpieza segura...');
  
  conn.on('ready', async () => {
    console.log('Conexión SSH lista.');
    try {
      // 2. Limpieza rápida y 100% segura usando rm -rf en el VPS (excluyendo la carpeta "3x3")
      const remoteFrontendDir = '/var/www/html';
      console.log(`Limpiando selectivamente con rm -rf en ${remoteFrontendDir} (preservando "3x3")...`);
      
      const cleanCmd = `find ${remoteFrontendDir} -mindepth 1 -maxdepth 1 ! -name '3x3' -exec rm -rf {} +`;
      const cleanResult = await executeSSHCommand(conn, cleanCmd);
      
      if (cleanResult.code !== 0) {
        console.error('Advertencia o error al limpiar el directorio:', cleanResult.stderr);
      } else {
        console.log('✔ Limpieza selectiva completada con éxito.');
      }

      // 3. Iniciar transferencia SFTP para subir la compilación de Angular
      console.log('Abriendo canal SFTP para subir el frontend...');
      const sftp = new Client();
      await sftp.connect(config);
      console.log('SFTP Conectado.');

      console.log(`Subiendo frontend de Angular desde ${localFrontendDir} a ${remoteFrontendDir}...`);
      await sftp.uploadDir(localFrontendDir, remoteFrontendDir);
      console.log('✔ Frontend de Angular subido con éxito.');

      // 4. Subir archivos de Backend Principal
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
        }
      }
      console.log('✔ Archivos de backend principal subidos.');
      await sftp.end();

      // 5. Instalar dependencias en el servidor y reiniciar PM2 para el Backend Principal
      console.log('Instalando dependencias de Node en el servidor y reiniciando PM2...');
      const deployCmd = 'cd /var/www/spbasket/backend && npm install playwright cheerio && npx playwright install chromium --with-deps && pm2 restart server';
      const deployResult = await executeSSHCommand(conn, deployCmd);
      
      console.log('STDOUT:', deployResult.stdout);
      if (deployResult.stderr) {
        console.error('STDERR:', deployResult.stderr);
      }

      console.log('\n======================================================');
      console.log(' 🎉 ¡DESPLIEGUE DE SPBASKET PRINCIPAL COMPLETADO!');
      console.log('======================================================\n');
      conn.end();
      process.exit(0);

    } catch (err) {
      console.error('Error durante el proceso de despliegue:', err);
      conn.end();
      process.exit(1);
    }
  }).on('error', (err) => {
    console.error('Fallo en la conexión SSH:', err);
    process.exit(1);
  }).connect(config);
}

deploy();
