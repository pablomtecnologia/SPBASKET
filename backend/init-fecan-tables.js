// init-fecan-tables.js - Inicializa las tablas necesarias para FECAN
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

async function initFecanTables() {
    console.log('🔧 Inicializando tablas FECAN...\n');

    try {
        // 1. Tabla de partidos FECAN
        console.log('📊 Creando tabla fecan_matches...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS fecan_matches (
                id SERIAL PRIMARY KEY,
                team_id VARCHAR(50) NOT NULL,
                round INTEGER NOT NULL,
                match_date VARCHAR(20),
                match_time VARCHAR(10),
                home_team VARCHAR(100),
                away_team VARCHAR(100),
                location VARCHAR(200),
                home_score INTEGER,
                away_score INTEGER,
                home_team_logo TEXT,
                away_team_logo TEXT,
                status VARCHAR(20) DEFAULT 'upcoming',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(team_id, round)
            );
        `);
        console.log('✅ Tabla fecan_matches creada');

        // 2. Índices para mejorar rendimiento
        console.log('🔍 Creando índices...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_fecan_team 
            ON fecan_matches(team_id);
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_fecan_status 
            ON fecan_matches(status);
        `);
        console.log('✅ Índices creados');

        // 3. Tabla de logs de importación (opcional)
        console.log('📝 Creando tabla fecan_import_logs...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS fecan_import_logs (
                id SERIAL PRIMARY KEY,
                import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                results JSONB,
                status VARCHAR(20),
                error_message TEXT
            );
        `);
        console.log('✅ Tabla fecan_import_logs creada');

        console.log('\n🎉 Todas las tablas FECAN inicializadas correctamente!\n');

    } catch (error) {
        console.error('❌ Error inicializando tablas:', error);
    } finally {
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    initFecanTables();
}

module.exports = { initFecanTables };
