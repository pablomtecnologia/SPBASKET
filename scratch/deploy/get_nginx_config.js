const { Client } = require('ssh2');

const config = {
  host: '94.143.142.26',
  port: 22,
  username: 'root',
  password: 'Saskipenguins2o24@'
};

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Conectado.');
  // Leer la configuración activa de Nginx
  conn.exec('cat /etc/nginx/sites-enabled/*', (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code) => {
      console.log(`\n=== CONFIGURACION DE NGINX (Código ${code}) ===\n`);
      console.log(output);
      conn.end();
    }).on('data', (data) => {
      output += data.toString();
    }).stderr.on('data', (data) => {
      console.error('STDERR: ' + data);
    });
  });
}).connect(config);
