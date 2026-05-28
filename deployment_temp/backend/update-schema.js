const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'spbasket_db'
    });

    try {
        console.log('🔌 Conectado a la base de datos.');

        // 1. Comprobar columnas existentes
        const [columns] = await connection.execute('SHOW COLUMNS FROM users');
        const columnNames = columns.map(c => c.Field);
        console.log('📝 Columnas actuales:', columnNames);

        // 2. Añadir columna 'avatar' si no existe
        if (!columnNames.includes('avatar')) {
            console.log('✨ Añadiendo columna "avatar"...');
            await connection.execute('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL');
            console.log('✅ Columna "avatar" añadida correctamente.');
        } else {
            console.log('ℹ️ La columna "avatar" ya existe.');
        }

        // 3. Añadir columna 'telefono' si no existe (útil para contacto)
        if (!columnNames.includes('telefono')) {
            console.log('✨ Añadiendo columna "telefono"...');
            await connection.execute('ALTER TABLE users ADD COLUMN telefono VARCHAR(20) DEFAULT NULL');
            console.log('✅ Columna "telefono" añadida correctamente.');
        }

    } catch (error) {
        console.error('❌ Error al actualizar la base de datos:', error);
    } finally {
        await connection.end();
        console.log('👋 Conexión cerrada.');
    }
}

updateSchema();
