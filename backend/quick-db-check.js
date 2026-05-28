const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:PinguinoBasket123!@localhost:5432/spbasket'
});

async function check() {
    try {
        const res = await pool.query("SELECT team_name, logo FROM competition_standings WHERE team_id = 'sp-negro' LIMIT 5");
        console.log('--- STANDINGS SP-NEGRO ---');
        console.table(res.rows);

        const resMatches = await pool.query("SELECT home_team, away_team, home_team_logo, away_team_logo FROM competition_matches WHERE team_id = 'sp-negro' LIMIT 5");
        console.log('--- MATCHES SP-NEGRO ---');
        console.table(resMatches.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
