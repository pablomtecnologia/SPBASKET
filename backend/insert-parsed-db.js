const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:PinguinoBasket123!@localhost:5432/spbasket'
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to DB');

        // Read JSON
        const dataPath = path.join(__dirname, 'parsed_manual_data.json');
        if (!fs.existsSync(dataPath)) {
            console.error('❌ Data file not found:', dataPath);
            return;
        }

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        const teams = ['spnegro', 'sprosa']; // Keys in JSON
        const teamIds = { 'spnegro': 'sp-negro', 'sprosa': 'sp-rosa' }; // Check DB IDs

        await client.query('BEGIN');

        // Ensure tables exist and have correct columns
        await client.query(`
            CREATE TABLE IF NOT EXISTS competition_standings (
                id SERIAL PRIMARY KEY,
                team_id VARCHAR(50), 
                position INTEGER,
                team_name VARCHAR(100), 
                played INTEGER, 
                won INTEGER, 
                lost INTEGER, 
                points_for INTEGER, 
                points_against INTEGER, 
                points_diff INTEGER, 
                points INTEGER,
                logo TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add missing columns if they don't exist
        const columnsToAddStandings = [
            ['points_for', 'INTEGER'],
            ['points_against', 'INTEGER'],
            ['points_diff', 'INTEGER'],
            ['points', 'INTEGER'],
            ['logo', 'TEXT']
        ];

        for (const [col, type] of columnsToAddStandings) {
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competition_standings' AND column_name='${col}') THEN
                        ALTER TABLE competition_standings ADD COLUMN ${col} ${type};
                    END IF;
                END $$;
            `);
        }

        await client.query(`
            CREATE TABLE IF NOT EXISTS competition_matches (
                id SERIAL PRIMARY KEY,
                team_id VARCHAR(50),
                round INTEGER,
                match_date VARCHAR(20),
                match_time VARCHAR(20),
                home_team VARCHAR(100),
                away_team VARCHAR(100),
                home_score INTEGER,
                away_score INTEGER,
                location VARCHAR(200),
                status VARCHAR(50),
                home_team_logo TEXT,
                away_team_logo TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const columnsToAddMatches = [
            ['home_team_logo', 'TEXT'],
            ['away_team_logo', 'TEXT']
        ];

        for (const [col, type] of columnsToAddMatches) {
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competition_matches' AND column_name='${col}') THEN
                        ALTER TABLE competition_matches ADD COLUMN ${col} ${type};
                    END IF;
                END $$;
            `);
        }



        for (const teamKey of teams) {
            const teamId = teamIds[teamKey];
            console.log(`\n🔄 Processing team: ${teamId} (key: ${teamKey})...`);

            const teamData = data[teamKey];
            if (!teamData) {
                console.warn(`⚠️ No data for ${teamKey}`);
                continue;
            }

            // 1. Clear existing data
            console.log(`   Deleting old data for ${teamId}...`);
            await client.query('DELETE FROM competition_standings WHERE team_id = $1', [teamId]);
            await client.query('DELETE FROM competition_matches WHERE team_id = $1', [teamId]);

            // 2. Insert Standings
            if (teamData.standings && teamData.standings.length > 0) {
                console.log(`   Inserting ${teamData.standings.length} standings...`);
                for (const s of teamData.standings) {
                    const pointsDiff = (s.points_for || 0) - (s.points_against || 0);
                    await client.query(`
                        INSERT INTO competition_standings 
                        (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points, logo)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    `, [
                        teamId,
                        s.position,
                        s.team_name,
                        s.played,
                        s.won,
                        s.lost,
                        s.points_for,
                        s.points_against,
                        pointsDiff,
                        s.points,
                        s.logo || ''
                    ]);
                }
            } else {
                console.warn('   ⚠️ No standings found');
            }

            // 3. Insert Matches
            if (teamData.matches && teamData.matches.length > 0) {
                console.log(`   Inserting ${teamData.matches.length} matches...`);
                for (const m of teamData.matches) {
                    await client.query(`
                        INSERT INTO competition_matches 
                        (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status, home_team_logo, away_team_logo)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    `, [
                        teamId,
                        m.round,
                        m.match_date,
                        m.match_time,
                        m.home_team,
                        m.away_team,
                        m.home_score,
                        m.away_score,
                        m.location,
                        m.status,
                        m.home_team_logo || m.logo_local || '',
                        m.away_team_logo || m.logo_visitante || ''
                    ]);
                }
            } else {
                console.warn('   ⚠️ No matches found');
            }
        }

        await client.query('COMMIT');
        console.log('\n✅ All data inserted successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error inserting data:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
