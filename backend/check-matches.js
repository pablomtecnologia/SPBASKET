const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

async function checkMatches() {
    try {
        const { rows } = await pool.query('SELECT * FROM matches LIMIT 5');
        console.log('✅ Matches table exists');
        console.log('📋 Sample data:', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}

checkMatches();
