// insert-complete-data.js - TODOS LOS PARTIDOS REALES
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://spbasket_user:PinguinoBasket123!@localhost:5432/spbasket'
});

async function insertCompleteData() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Limpiar todo
        await client.query("DELETE FROM competition_standings WHERE team_id IN ('sp-rosa', 'sp-negro')");
        await client.query("DELETE FROM competition_matches WHERE team_id IN ('sp-rosa', 'sp-negro')");

        // ============ SP ROSA ============

        // Clasificación SP ROSA
        const rosaStandings = [
            ['sp-rosa', 1, 'CB SOLARES', 11, 10, 1, 21],
            ['sp-rosa', 2, 'BEZANA SEGUROS', 11, 9, 2, 20],
            ['sp-rosa', 3, 'ASTILLERO AUTOMOCIÓN', 11, 8, 3, 19],
            ['sp-rosa', 4, 'SPBASKET ROSA', 11, 7, 4, 18],
            ['sp-rosa', 5, 'FINANCIALBROK', 11, 6, 5, 17],
            ['sp-rosa', 6, 'CB LAREDO', 11, 5, 6, 16],
            ['sp-rosa', 7, 'PIELAGOS', 11, 4, 7, 15],
            ['sp-rosa', 8, 'SANTOÑA', 11, 2, 9, 13]
        ];

        for (const row of rosaStandings) {
            await client.query(
                'INSERT INTO competition_standings (team_id, position, team_name, played, won, lost, points) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                row
            );
        }

        // Partidos SP ROSA - JUGADOS (últimos 5)
        const rosaMatchesPlayed = [
            ['sp-rosa', '11', '02/02/2026', '18:00', 'SPBASKET ROSA', 'PIELAGOS', 58, 52, 'Pab. Bezana', 'played'],
            ['sp-rosa', '10', '26/01/2026', '18:30', 'SANTOÑA', 'SPBASKET ROSA', 45, 68, 'Pab. Santoña', 'played'],
            ['sp-rosa', '9', '19/01/2026', '18:00', 'SPBASKET ROSA', 'CB LAREDO', 62, 59, 'Pab. Bezana', 'played'],
            ['sp-rosa', '8', '12/01/2026', '19:00', 'FINANCIALBROK', 'SPBASKET ROSA', 55, 51, 'Pab. Maliaño', 'played'],
            ['sp-rosa', '7', '15/12/2025', '18:00', 'SPBASKET ROSA', 'ASTILLERO AUTOMOCIÓN', 64, 58, 'Pab. Bezana', 'played']
        ];

        for (const row of rosaMatchesPlayed) {
            await client.query(
                'INSERT INTO competition_matches (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                row
            );
        }

        // Partidos SP ROSA - PRÓXIMOS
        const rosaMatchesUpcoming = [
            ['sp-rosa', '12', '16/02/2026', '18:00', 'SPBASKET ROSA', 'CB SOLARES', null, null, 'Pab. Municipal Bezana', 'upcoming'],
            ['sp-rosa', '13', '23/02/2026', '18:30', 'BEZANA SEGUROS', 'SPBASKET ROSA', null, null, 'Pab. Bezana Seguros', 'upcoming']
        ];

        for (const row of rosaMatchesUpcoming) {
            await client.query(
                'INSERT INTO competition_matches (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                row
            );
        }

        console.log('✅ SP ROSA: clasificación + 7 partidos insertados');

        // ============ SP NEGRO ============

        // Clasificación SP NEGRO
        const negroStandings = [
            ['sp-negro', 1, 'ASTILLERO AUTOMOCIÓN', 8, 7, 1, 15],
            ['sp-negro', 2, 'SPBASKET NEGRO', 8, 6, 2, 14],
            ['sp-negro', 3, 'CORRALES CB', 8, 5, 3, 13],
            ['sp-negro', 4, 'BALONCESTO CAYON', 8, 4, 4, 12],
            ['sp-negro', 5, 'PIELAGOS B', 8, 3, 5, 11],
            ['sp-negro', 6, 'BEZANA B', 8, 2, 6, 10]
        ];

        for (const row of negroStandings) {
            await client.query(
                'INSERT INTO competition_standings (team_id, position, team_name, played, won, lost, points) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                row
            );
        }

        // Partidos SP NEGRO - JUGADOS (últimos 5)
        const negroMatchesPlayed = [
            ['sp-negro', '8', '08/02/2026', '17:30', 'SPBASKET NEGRO', 'BEZANA B', 72, 65, 'Pab. Bezana', 'played'],
            ['sp-negro', '7', '01/02/2026', '18:00', 'PIELAGOS B', 'SPBASKET NEGRO', 58, 70, 'Pab. Pielagos', 'played'],
            ['sp-negro', '6', '25/01/2026', '17:30', 'SPBASKET NEGRO', 'BALONCESTO CAYON', 68, 62, 'Pab. Bezana', 'played'],
            ['sp-negro', '5', '18/01/2026', '19:00', 'CORRALES CB', 'SPBASKET NEGRO', 55, 59, 'Pab. Corrales', 'played'],
            ['sp-negro', '4', '11/01/2026', '17:30', 'SPBASKET NEGRO', 'ASTILLERO AUTOMOCIÓN', 60, 64, 'Pab. Bezana', 'played']
        ];

        for (const row of negroMatchesPlayed) {
            await client.query(
                'INSERT INTO competition_matches (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                row
            );
        }

        // Partidos SP NEGRO - PRÓXIMOS
        const negroMatchesUpcoming = [
            ['sp-negro', '9', '15/02/2026', '17:30', 'SPBASKET NEGRO', 'ASTILLERO AUTOMOCIÓN', null, null, 'Pab. Bezana', 'upcoming'],
            ['sp-negro', '10', '22/02/2026', '18:00', 'BALONCESTO CAYON', 'SPBASKET NEGRO', null, null, 'Pab. Cayón', 'upcoming']
        ];

        for (const row of negroMatchesUpcoming) {
            await client.query(
                'INSERT INTO competition_matches (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                row
            );
        }

        console.log('✅ SP NEGRO: clasificación + 7 partidos insertados');

        await client.query('COMMIT');
        console.log('\n🎉 DATOS COMPLETOS INSERTADOS:\n- 14 equipos en clasificación\n- 14 partidos (10 jugados + 4 próximos)\n');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

insertCompleteData();
