const { Client } = require('pg');

async function setupDatabase() {
    // 1. Conectar a 'postgres' para crear la BD 'spbasket'
    const client = new Client({
        connectionString: 'postgresql://postgres:Root123!@localhost:5432/postgres'
    });

    try {
        await client.connect();
        console.log('✅ Conectado como postgres.');

        // Verificar si existe la BD
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'spbasket'");
        if (res.rowCount === 0) {
            console.log('📦 Creando base de datos spbasket...');
            await client.query('CREATE DATABASE spbasket');
            console.log('✅ Base de datos spbasket creada.');
        } else {
            console.log('ℹ️ La base de datos spbasket ya existe.');
        }

        await client.end();

        // 2. Conectar a la nueva BD 'spbasket' para crear tablas
        console.log('🔄 Conectando a spbasket...');
        const pool = new Client({
            connectionString: 'postgresql://postgres:Root123!@localhost:5432/spbasket'
        });
        await pool.connect();

        // Crear tabla fecan_matches si no existe
        console.log('🛠️ Creando tablas...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS fecan_matches (
                id SERIAL PRIMARY KEY,
                team_id VARCHAR(50) NOT NULL,
                round VARCHAR(50) NOT NULL,
                date TIMESTAMP,
                home_team VARCHAR(100) NOT NULL,
                home_score INTEGER,
                visitor_team VARCHAR(100) NOT NULL,
                visitor_score INTEGER,
                court VARCHAR(100),
                status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(team_id, round)
            );
        `);

        // Crear tabla users si no existe (para login)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nombre VARCHAR(100),
                rol VARCHAR(20) DEFAULT 'user'
            );
        `);

        // Insertar admin si no existe
        const adminCheck = await pool.query("SELECT * FROM users WHERE username = 'admin'");
        if (adminCheck.rowCount === 0) {
            // Hash de 'spbasket2024' (usando bcryptjs si estuviera disponible, pero aquí insertaré algo temporal o updatearé luego)
            // Nota: El backend usa bcrypt. Si inserto texto plano no funcionará el login.
            // Para simplificar, asumiré que el backend maneja el hash o crearé un usuario admin de prueba.
            // Mejor insertamos uno con hash real si es posible, o dejamos que el backend lo maneje.
            // Como no puedo importar bcrypt aquí fácilmente sin path,
            // Insertaré un usuario admin con un hash conocido para 'spbasket2024'
            // Hash generado previamente: $2a$10$Xk/Jz.p.v../.. (ejemplo)
            // Mejor solución: Dejar que el usuario se registre o usar un hash precalculado.
            // Hash para 'spbasket2024': $2a$10$YourGeneratedHashHere
            // Voy a usar un hash válido para 'spbasket2024':
            // $2a$10$Kq1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0
            // Usaré un script separado para crear el admin con hash correcto si hace falta.
            console.log('⚠️ Usuario admin no creado automáticamnete (requiere hash).');
        }

        console.log('✅ Tablas creadas exitosamente.');
        await pool.end();

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

setupDatabase();
