const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

async function cleanOldSettings() {
    try {
        // Delete old settings
        await pool.query("DELETE FROM settings WHERE key IN ('quiniela_open', 'mvp_voting_open')");
        console.log('✅ Settings antiguos eliminados');

        // Show current settings
        const { rows } = await pool.query('SELECT * FROM settings ORDER BY key');
        console.log('📋 Settings actuales:');
        rows.forEach(row => console.log(`  - ${row.key}: ${row.value}`));

        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}

cleanOldSettings();
