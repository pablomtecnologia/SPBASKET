
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'spbasket'
        });

        console.log('🔌 Conectado a la base de datos.');

        try {
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL, 
                ADD COLUMN reset_expires DATETIME DEFAULT NULL
            `);
            console.log('✅ Columnas reset_token y reset_expires agregadas.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ Las columnas ya existen.');
            } else {
                throw err;
            }
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
