const Client = require('ssh2-sftp-client');
async function check() {
  const sftp = new Client();
  try {
    await sftp.connect({
      host: 'access-5017181970.webspace-host.com',
      port: 22,
      username: 'a1406158',
      password: 'Saskipenguins2o24@'
    });
    console.log('Conectado a SFTP!');
    const list = await sftp.list('.');
    console.log(JSON.stringify(list, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await sftp.end();
  }
}
check();
