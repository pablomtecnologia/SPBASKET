// init-fecan-full-tables.js - Inicializa tablas completas para FECAN
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

async function initFullTables() {
    console.log('🔧 Inicializando tablas completas de FECAN...\n');

    try {
        const client = await pool.connect();

        try {
            // 1. Tabla de clasificación
            console.log('📊 Creando tabla fecan_clasificacion...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS fecan_clasificacion (
                    id SERIAL PRIMARY KEY,
                    team_id VARCHAR(50) NOT NULL,
                    position INTEGER,
                    team_name VARCHAR(200),
                    played INTEGER DEFAULT 0,
                    won INTEGER DEFAULT 0,
                    lost INTEGER DEFAULT 0,
                    points_for INTEGER DEFAULT 0,
                    points_against INTEGER DEFAULT 0,
                    points_diff INTEGER DEFAULT 0,
                    points INTEGER DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(team_id, team_name)
                );
            `);
            console.log('✅ Tabla fecan_clasificacion creada');

            // 2. Tabla de partidos (mejorada)
            console.log('📅 Creando tabla fecan_partidos...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS fecan_partidos (
                    id SERIAL PRIMARY KEY,
                    team_id VARCHAR(50) NOT NULL,
                    jornada VARCHAR(20),
                    fecha VARCHAR(50),
                    hora VARCHAR(10),
                    equipo_local VARCHAR(200),
                    equipo_visitante VARCHAR(200),
                    resultado_local INTEGER,
                    resultado_visitante INTEGER,
                    pabellon VARCHAR(300),
                    estado VARCHAR(20) DEFAULT 'upcoming',
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(team_id, jornada, equipo_local, equipo_visitante)
                );
            `);
            console.log('✅ Tabla fecan_partidos creada');

            // 3. Tabla de fotos/galería
            console.log('📸 Creando tabla fecan_fotos...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS fecan_fotos (
                    id SERIAL PRIMARY KEY,
                    team_id VARCHAR(50) NOT NULL,
                    src TEXT NOT NULL,
                    alt VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(team_id, src)
                );
            `);
            console.log('✅ Tabla fecan_fotos creada');

            // 4. Tabla de información de competición
            console.log('ℹ️  Creando tabla fecan_competicion_info...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS fecan_competicion_info (
                    id SERIAL PRIMARY KEY,
                    team_id VARCHAR(50) NOT NULL UNIQUE,
                    title VARCHAR(300),
                    season VARCHAR(20),
                    competition_id INTEGER,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Tabla fecan_competicion_info creada');

            // 5. Índices para mejorar rendimiento
            console.log('🔍 Creando índices...');
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_fecan_partidos_team 
                ON fecan_partidos(team_id);
            `);
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_fecan_partidos_estado 
                ON fecan_partidos(estado);
            `);
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_fecan_clasificacion_team 
                ON fecan_clasificacion(team_id);
            `);
            console.log('✅ Índices creados');

            console.log('\n🎉 ¡Todas las tablas de FECAN completo inicializadas!\n');

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error inicializando tablas:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    initFullTables();
}

module.exports = { initFullTables };
