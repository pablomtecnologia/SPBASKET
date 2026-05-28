const { Client } = require('ssh2');

const config = {
  host: '94.143.142.26',
  port: 22,
  username: 'root',
  password: 'Saskipenguins2o24@'
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Conectado al servidor por SSH para diagnosticar propiedades de Prisma.');
  const cmd = `node -e "
    try {
      const { PrismaClient } = require('/var/www/spbasket-3x3/backend/node_modules/@prisma/client');
      const prisma = new PrismaClient();
      console.log('Prisma Client instanciado con éxito.');
      console.log('Modelos disponibles:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    } catch(e) {
      console.error('ERROR instanciando:', e.message);
    }
  "`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('RESULTADO:\n' + data);
    }).stderr.on('data', (data) => {
      console.error('ERROR:\n' + data);
    });
  });
}).connect(config);
