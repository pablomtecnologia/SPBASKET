// update-from-fecan.js - Script para actualizar datos desde FECAN
const axios = require('axios');
const cheerio = require('cheerio');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:PinguinoBasket123!@localhost:5432/spbasket'
});

// IDs de competiciones en FECAN
const COMPETITIONS = {
    'sp-rosa': {
        id: 1674,
        url: 'https://www.fecanbaloncesto.com/competicion/?id=1674&round=0',
        teamName: 'SPBASKET ROSA'
    },
    'sp-negro': {
        id: 1675,
        url: 'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0',
        teamName: 'SPBASKET NEGRO'
    }
};

async function scrapeCompetition(teamId, competitionData) {
    console.log(`\n🔍 Scraping ${teamId} desde: ${competitionData.url}`);

    try {
        const response = await axios.get(competitionData.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // Scrapear clasificación
        const standings = [];
        $('table.clasificacion tr, table.standings tr, .classification-table tr').each((i, row) => {
            if (i === 0) return; // Skip header
            const cells = $(row).find('td');
            if (cells.length >= 8) {
                const teamName = $(cells[1]).text().trim();
                standings.push({
                    position: i,
                    team_name: teamName,
                    played: parseInt($(cells[2]).text()) || 0,
                    won: parseInt($(cells[3]).text()) || 0,
                    lost: parseInt($(cells[4]).text()) || 0,
                    points_for: parseInt($(cells[5]).text()) || 0,
                    points_against: parseInt($(cells[6]).text()) || 0,
                    points: parseInt($(cells[7]).text()) || 0
                });
            }
        });

        // Scrapear partidos
        const matches = [];
        $('table.calendario tr, table.calendar tr, .calendar-table tr').each((i, row) => {
            if (i === 0) return; // Skip header
            const cells = $(row).find('td');
            if (cells.length >= 6) {
                matches.push({
                    round: parseInt($(cells[0]).text()) || i,
                    match_date: $(cells[1]).text().trim(),
                    match_time: $(cells[2]).text().trim(),
                    home_team: $(cells[3]).text().trim(),
                    away_team: $(cells[4]).text().trim(),
                    home_score: parseInt($(cells[5]).text()) || null,
                    away_score: parseInt($(cells[6]).text()) || null,
                    location: $(cells[7]).text().trim() || 'Por determinar',
                    status: $(cells[5]).text() ? 'played' : 'upcoming'
                });
            }
        });

        console.log(`✅ ${teamId}: ${standings.length} equipos, ${matches.length} partidos`);

        // Guardar en base de datos
        await saveToDatabase(teamId, standings, matches, competitionData);

        return { standings, matches };
    } catch (error) {
        console.error(`❌ Error scraping ${teamId}:`, error.message);
        throw error;
    }
}

async function saveToDatabase(teamId, standings, matches, competitionData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Limpiar datos antiguos
        await client.query('DELETE FROM competition_standings WHERE team_id = $1', [teamId]);
        await client.query('DELETE FROM competition_matches WHERE team_id = $1', [teamId]);

        // Insertar clasificación
        for (const standing of standings) {
            await client.query(`
                INSERT INTO competition_standings 
                (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                teamId,
                standing.position,
                standing.team_name,
                standing.played,
                standing.won,
                standing.lost,
                standing.points_for,
                standing.points_against,
                standing.points_for - standing.points_against,
                standing.points
            ]);
        }

        // Insertar partidos
        for (const match of matches) {
            await client.query(`
                INSERT INTO competition_matches 
                (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                teamId,
                match.round,
                match.match_date,
                match.match_time,
                match.home_team,
                match.away_team,
                match.home_score,
                match.away_score,
                match.location,
                match.status
            ]);
        }

        await client.query('COMMIT');
        console.log(`💾 Datos guardados en BD para ${teamId}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error guardando en BD:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function updateAll() {
    console.log('🚀 Iniciando actualización de datos desde FECAN...\n');

    for (const [teamId, competitionData] of Object.entries(COMPETITIONS)) {
        try {
            await scrapeCompetition(teamId, competitionData);
        } catch (error) {
            console.error(`❌ Error procesando ${teamId}:`, error.message);
        }
    }

    console.log('\n✅ Actualización completada');
    await pool.end();
}

// Ejecutar si se llama directamente
if (require.main === module) {
    updateAll().catch(console.error);
}

module.exports = { scrapeCompetition, updateAll };
