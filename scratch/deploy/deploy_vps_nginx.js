const Client = require('ssh2-sftp-client');
const { Client: SSHClient } = require('ssh2');

const config = {
  host: '94.143.142.26',
  port: 22,
  username: 'root',
  password: 'Saskipenguins2o24@'
};

async function uploadNginx() {
  const sftp = new Client();
  try {
    console.log('Conectando a SFTP para subir nginx_final.conf...');
    await sftp.connect(config);
    console.log('Conectado con éxito!');

    const localFile = 'c:/Users/pablo/Desktop/SPBASKET/nginx_final.conf';
    const remoteFile1 = '/etc/nginx/sites-available/spbasket';
    const remoteFile2 = '/etc/nginx/sites-enabled/spbasket';

    console.log(`Subiendo ${localFile} a ${remoteFile1}...`);
    await sftp.fastPut(localFile, remoteFile1);
    console.log(`Subiendo ${localFile} a ${remoteFile2}...`);
    await sftp.fastPut(localFile, remoteFile2);
    console.log('¡Archivos Nginx subidos con éxito en ambas rutas!');

  } catch (err) {
    console.error('Error al subir Nginx config:', err);
    throw err;
  } finally {
    await sftp.end();
  }
}

function runSSHCommand(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new SSHClient();
    conn.on('ready', () => {
      console.log(`SSH Listo. Ejecutando: "${cmd}"...`);
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let stdout = '';
        let stderr = '';
        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ code, stdout, stderr });
        }).on('data', (data) => {
          stdout += data;
        }).stderr.on('data', (data) => {
          stderr += data;
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect(config);
  });
}

async function main() {
  try {
    // 1. Subir la nueva configuración de Nginx
    await uploadNginx();

    // 2. Probar sintaxis Nginx
    console.log('Probando sintaxis de Nginx en el servidor VPS...');
    const testResult = await runSSHCommand('nginx -t');
    console.log('--- Nginx Test Output ---');
    console.log('STDOUT:', testResult.stdout);
    console.log('STDERR:', testResult.stderr);
    console.log('Exit Code:', testResult.code);

    if (testResult.code !== 0) {
      console.error('❌ Error de sintaxis en Nginx. Revisa el archivo subido.');
      return;
    }

    // 3. Recargar Nginx si la prueba fue exitosa
    console.log('Recargando el servicio Nginx...');
    const reloadResult = await runSSHCommand('systemctl reload nginx');
    console.log('--- Nginx Reload Output ---');
    console.log('STDOUT:', reloadResult.stdout);
    console.log('STDERR:', reloadResult.stderr);
    console.log('Exit Code:', reloadResult.code);

    if (reloadResult.code === 0) {
      console.log('✅ ¡Nginx recargado con éxito! Los cambios están en vivo.');
    } else {
      console.error('❌ Error al recargar Nginx.');
    }

  } catch (err) {
    console.error('Proceso de actualización de Nginx fallido:', err);
  }
}

main();
