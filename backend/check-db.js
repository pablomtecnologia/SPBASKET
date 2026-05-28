const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:PinguinoBasket123!@localhost:5432/spbasket'
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error:', err.message);
    } else {
        console.log('✅ Connected:', res.rows[0].now);
    }
    pool.end();
});
