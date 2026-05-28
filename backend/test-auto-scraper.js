// test-auto-scraper.js - Script de prueba para el scraper automático
const { Pool } = require('pg');
const { runAutoImport } = require('./fecan-auto-scraper');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

async function test() {
    console.log('🧪 Probando scraper automático FECAN...\n');

    try {
        const results = await runAutoImport(pool);

        console.log('\n📊 RESULTADOS FINALES:');
        console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        console.error('❌ Error en prueba:', error);
    } finally {
        await pool.end();
        console.log('\n✅ Prueba completada');
    }
}

test();
