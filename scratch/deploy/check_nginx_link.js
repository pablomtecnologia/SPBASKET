const { Client } = require('ssh2');

const config = {
  host: '94.143.142.26',
  port: 22,
  username: 'root',
  password: 'Saskipenguins2o24@'
};

function runSSHCommand(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
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
    console.log('Listando /etc/nginx/sites-enabled/...');
    const resEnabled = await runSSHCommand('ls -la /etc/nginx/sites-enabled');
    console.log('STDOUT:\n', resEnabled.stdout);

    console.log('Comprobando qué configuración está activa en Nginx...');
    const resActive = await runSSHCommand('nginx -T');
    console.log('STDOUT (primeras 50 líneas):\n', resActive.stdout.split('\n').slice(0, 50).join('\n'));
  } catch (err) {
    console.error(err);
  }
}

main();
