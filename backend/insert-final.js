// insert-final.js
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://spbasket_user:PinguinoBasket123!@localhost:5432/spbasket'
});

async function insertData() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Limpiar datos existentes
        await client.query("DELETE FROM competition_standings WHERE team_id IN ('sp-rosa', 'sp-negro')");
        await client.query("DELETE FROM competition_matches WHERE team_id IN ('sp-rosa', 'sp-negro')");

        // SP ROSA - Clasificación (solo columnas que existen)
        const rosaStandings = [
            ['sp-rosa', 1, 'CB SOLARES', 11, 10, 1, 21],
            ['sp-rosa', 2, 'BEZANA SEGUROS', 11, 9, 2, 20],
            ['sp-rosa', 3, 'ASTILLERO AUTOMOCIÓN', 11, 8, 3, 19],
            ['sp-rosa', 4, 'SPBASKET ROSA', 11, 7, 4, 18],
            ['sp-rosa', 5, 'FINANCIALBROK', 11, 6, 5, 17]
        ];

        for (const row of rosaStandings) {
            await client.query(
                'INSERT INTO competition_standings (team_id, position, team_name, played, won, lost, points) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                row
            );
        }
        console.log('✅ SP ROSA clasificación insertada');

        // SP ROSA - Partido
        await client.query(
            'INSERT INTO competition_matches (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            ['sp-rosa', '12', '16/02/2026', '18:00', 'SPBASKET ROSA', 'CB SOLARES', null, null, 'Pab. Municipal Bezana', 'upcoming']
        );
        console.log('✅ SP ROSA partido insertado');

        // SP NEGRO - Clasificación
        const negroStandings = [
            ['sp-negro', 1, 'ASTILLERO AUTOMOCIÓN', 8, 7, 1, 15],
            ['sp-negro', 2, 'SPBASKET NEGRO', 8, 6, 2, 14],
            ['sp-negro', 3, 'CORRALES CB', 8, 5, 3, 13],
            ['sp-negro', 4, 'BALONCESTO CAYON', 8, 4, 4, 12]
        ];

        for (const row of negroStandings) {
            await client.query(
                'INSERT INTO competition_standings (team_id, position, team_name, played, won, lost, points) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                row
            );
        }
        console.log('✅ SP NEGRO clasificación insertada');

        // SP NEGRO - Partido
        await client.query(
            'INSERT INTO competition_matches (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            ['sp-negro', '9', '15/02/2026', '17:30', 'SPBASKET NEGRO', 'ASTILLERO AUTOMOCIÓN', null, null, 'Pab. Bezana', 'upcoming']
        );
        console.log('✅ SP NEGRO partido insertado');

        await client.query('COMMIT');
        console.log('\n🎉 TODOS LOS DATOS INSERTADOS CORRECTAMENTE\n');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

insertData();
