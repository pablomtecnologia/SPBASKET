const Client = require('ssh2-sftp-client');

const config = {
  host: '94.143.142.26',
  port: 22,
  username: 'root',
  password: 'Saskipenguins2o24@'
};

async function listUploads() {
  const sftp = new Client();
  try {
    await sftp.connect(config);
    const remoteDir = '/var/www/spbasket-3x3/backend/uploads';
    const exists = await sftp.exists(remoteDir);
    if (!exists) {
      console.log('El directorio de subidas aún no existe en el VPS.');
      return;
    }
    const files = await sftp.list(remoteDir);
    console.log('Archivos subidos en el VPS:');
    console.log(files.map(f => f.name));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sftp.end();
  }
}

listUploads();
