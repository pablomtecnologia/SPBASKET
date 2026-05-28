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
  
  try {
    console.log('Conectando al VPS de Saski Penguins vía SFTP (Backend 3x3)...');
    await sftp.connect(config);
    console.log('¡Conectado vía SFTP con éxito!');

    const rootDir = path.resolve(__dirname, '../..');
    
    // 1. Detectar carpetas de backend del 3x3
    let localBackendDir = '';
    if (fs.existsSync(path.join(rootDir, 'NUEVO_BACKEND/backend/package.json'))) {
      localBackendDir = path.join(rootDir, 'NUEVO_BACKEND/backend');
    } else if (fs.existsSync(path.join(rootDir, 'backend/package.json'))) {
      localBackendDir = path.join(rootDir, 'backend');
    } else {
      throw new Error("No se encontró la carpeta del backend del Torneo 3x3 (package.json).");
    }

    const localSrcDir = path.join(localBackendDir, 'src');
    const localSchema = path.join(localBackendDir, 'prisma/schema.prisma');
    const localPackage = path.join(localBackendDir, 'package.json');
    const localNodemon = path.join(localBackendDir, 'nodemon.json');

    const remoteBackendDir = '/var/www/spbasket-3x3/backend';
    const remoteSrcDir = `${remoteBackendDir}/src`;
    const remotePrismaDir = `${remoteBackendDir}/prisma`;

    // Asegurarse de que las carpetas remotas existen
    if (!(await sftp.exists(remoteSrcDir))) {
      await sftp.mkdir(remoteSrcDir, true);
    }
    if (!(await sftp.exists(remotePrismaDir))) {
      await sftp.mkdir(remotePrismaDir, true);
    }

    // A. Subir recursivamente toda la carpeta backend/src
    console.log(`Subiendo carpeta backend/src recursivamente de ${localSrcDir} a ${remoteSrcDir}...`);
    await sftp.uploadDir(localSrcDir, remoteSrcDir);
    console.log('✔ Carpeta src subida con éxito.');

    // B. Subir schema.prisma si existe
    if (fs.existsSync(localSchema)) {
      console.log(`Subiendo schema.prisma de ${localSchema} a ${remotePrismaDir}/schema.prisma...`);
      await sftp.fastPut(localSchema, `${remotePrismaDir}/schema.prisma`);
      console.log('✔ schema.prisma subido con éxito.');
    }

    // C. Subir package.json si existe
    if (fs.existsSync(localPackage)) {
      console.log(`Subiendo package.json a ${remoteBackendDir}/package.json...`);
      await sftp.fastPut(localPackage, `${remoteBackendDir}/package.json`);
      console.log('✔ package.json subido con éxito.');
    }

    // D. Subir nodemon.json si existe
    if (fs.existsSync(localNodemon)) {
      console.log(`Subiendo nodemon.json a ${remoteBackendDir}/nodemon.json...`);
      await sftp.fastPut(localNodemon, `${remoteBackendDir}/nodemon.json`);
      console.log('✔ nodemon.json subido con éxito.');
    }

  } catch (err) {
    console.error('Error durante la subida por SFTP:', err);
    process.exit(1);
  } finally {
    await sftp.end();
    console.log('Conexión SFTP cerrada.');
  }

  // 2. SSH para dependencias, Prisma generate, Prisma push y reinicio de PM2
  console.log('Estableciendo conexión SSH para regenerar Prisma y reiniciar PM2 (3x3)...');
  const conn = new SSHClient();
  conn.on('ready', () => {
    console.log('Conexión SSH lista.');
    const cmd = 'cd /var/www/spbasket-3x3/backend && npm install --no-audit --no-fund && npx prisma generate && npx prisma db push --accept-data-loss && pm2 restart spbasket-3x3';
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('Error al ejecutar comandos por SSH:', err);
        conn.end();
        process.exit(1);
      }
      stream.on('close', (code, signal) => {
        console.log(`Comando SSH finalizado con código de salida: ${code}`);
        conn.end();
        console.log('\n======================================================');
        console.log(' 🎉 ¡DESPLIEGUE DE BACKEND 3x3 COMPLETADO CON ÉXITO!');
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
