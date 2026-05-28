const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ DB connection error:', err.message);
    } else {
        console.log('✅ DB connection successful:', res.rows[0]);
    }
    pool.end();
});
