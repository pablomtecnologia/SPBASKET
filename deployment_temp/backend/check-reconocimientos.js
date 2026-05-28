require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkReconocimientos() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'spbasket'
        });

        console.log('✅ Conectado a la BD');

        console.log('--- RECONOCIMIENTOS ---');
        const [rows] = await connection.execute('SELECT * FROM reconocimientos_medicos');
        console.table(rows);

        console.log('--- USUARIOS ---');
        const [users] = await connection.execute('SELECT id, username, rol FROM users');
        console.table(users);

        await connection.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkReconocimientos();
