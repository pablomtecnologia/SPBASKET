const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    const client = new Client({
        connectionString: 'postgresql://postgres:Root123!@localhost:5432/spbasket'
    });

    try {
        await client.connect();

        const password = 'spbasket2024';
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, password, nombre, rol)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `;

        const res = await client.query(query, ['admin', hashedPassword, 'Administrador', 'admin']);

        if (res.rowCount > 0) {
            console.log('✅ Usuario admin creado con contraseña correcta.');
        } else {
            console.log('ℹ️ Usuario admin ya existía.');
            // Opcional: Actualizar password si ya existía para asegurar que funciona
            await client.query("UPDATE users SET password = $1 WHERE username = 'admin'", [hashedPassword]);
            console.log('✅ Contraseña de admin actualizada.');
        }

        await client.end();
    } catch (e) {
        console.error('❌ Error creando admin:', e);
    }
}

createAdmin();
