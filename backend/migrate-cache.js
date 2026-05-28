const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const cacheDir = path.join(__dirname, 'cache');

async function migrate() {
    try {
        const teams = ['sp-rosa', 'sp-negro'];

        for (const teamId of teams) {
            const cacheFile = path.join(cacheDir, `${teamId}.json`);
            if (!fs.existsSync(cacheFile)) {
                console.log(`⚠️ No cache for ${teamId}`);
                continue;
            }

            const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
            console.log(`📦 Migrating ${teamId}...`);

            // Info
            if (data.info) {
                await pool.query(
                    'INSERT INTO competition_info (team_id, title, category, season) VALUES ($1, $2, $3, $4) ON CONFLICT (team_id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category',
                    [teamId, data.info.title || teamId, data.info.category || '', '2025/2026']
                );
            }

            // Clasificacion
            if (data.clasificacion) {
                for (const t of data.clasificacion) {
                    await pool.query(
                        'INSERT INTO competition_standings (team_id, position, team_name, played, won, lost, points) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (team_id, team_name) DO UPDATE SET position = EXCLUDED.position, played = EXCLUDED.played, won = EXCLUDED.won, lost = EXCLUDED.lost, points = EXCLUDED.points',
                        [teamId, t.position, t.team_name, t.played, t.won, t.lost, t.points]
                    );
                }
            }

            // Partidos
            if (data.partidos) {
                // Clear old matches for this team to avoid duplicates if needed, or just insert
                await pool.query('DELETE FROM competition_matches WHERE team_id = $1', [teamId]);
                for (const p of data.partidos) {
                    await pool.query(
                        'INSERT INTO competition_matches (team_id, round, match_date, match_time, home_team, away_team, location, home_score, away_score, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                        [teamId, p.jornada || p.round, p.fecha || p.match_date, p.hora || p.match_time, p.equipo_local || p.home_team, p.equipo_visitante || p.away_team, p.pabellon || p.location, p.resultado_local || p.home_score, p.resultado_visitante || p.away_score, p.estado || p.status]
                    );
                }
            }
        }

        console.log('✅ Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during migration:', err);
        process.exit(1);
    }
}

migrate();
