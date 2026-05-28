const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://spbasket_user:Basket123!@localhost:5432/spbasket'
});
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    .then(res => {
        console.log('TABLES:', res.rows.map(r => r.table_name).join(', '));
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
