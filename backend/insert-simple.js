// insert-simple.js
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://spbasket_user:PinguinoBasket123!@localhost:5432/spbasket'
});

async function insert() {
    const client = await pool.connect();
    try {
        // Probar con solo las columnas básicas
        await client.query("DELETE FROM competition_standings");
        await client.query("DELETE FROM competition_matches");

        // Insertar dato de prueba
        const result = await client.query(
            "INSERT INTO competition_standings (team_id, position, team_name, played, won, lost) VALUES ('sp-rosa', 1, 'TEST TEAM', 10, 5, 5) RETURNING *"
        );

        console.log('✅ Resultado:', result.rows[0]);
        console.log('✅ Columnas disponibles:', Object.keys(result.rows[0]));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

insert();
