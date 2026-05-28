// fecan-auto-scraper.js - Servicio automático de importación FECAN
const { getFecanMatches } = require('./scraper-fecan');

/**
 * Configuración de equipos a monitorear
 */
const TEAMS_CONFIG = {
    'sp-rosa': {
        fecanId: 4046,
        name: 'SP ROSA',
        enabled: true
    },
    'sp-negro': {
        fecanId: 4046, // Mismo club, diferentes equipos
        name: 'SP NEGRO',
        enabled: true
    }
};

/**
 * Importa partidos de FECAN y los guarda en la base de datos
 * @param {Object} pool - Pool de conexión PostgreSQL
 * @param {string} teamId - ID del equipo ('sp-rosa' o 'sp-negro')
 * @returns {Promise<Object>} - Estadísticas de la importación
 */
async function importTeamMatches(pool, teamId) {
    const config = TEAMS_CONFIG[teamId];
    
    if (!config || !config.enabled) {
        console.log(`⏭️ Equipo ${teamId} deshabilitado o no existe`);
        return { skipped: true };
    }

    console.log(`\n🔄 Importando partidos para ${config.name} (ID FECAN: ${config.fecanId})...`);
    
    try {
        // 1. Obtener datos de FECAN
        const matches = await getFecanMatches(config.fecanId);
        
        if (!matches || matches.length === 0) {
            console.log(`⚠️ No se encontraron partidos para ${config.name}`);
            return { error: 'No se encontraron partidos', count: 0 };
        }

        console.log(`📊 Encontrados ${matches.length} partidos para ${config.name}`);

        // 2. Guardar en base de datos
        let newMatches = 0;
        let updatedMatches = 0;
        let errors = 0;

        for (const match of matches) {
            try {
                // Verificar si el partido ya existe
                const existingMatch = await pool.query(
                    'SELECT id FROM fecan_matches WHERE team_id = $1 AND round = $2',
                    [teamId, match.round]
                );

                if (existingMatch.rows.length > 0) {
                    // Actualizar partido existente
                    await pool.query(`
                        UPDATE fecan_matches 
                        SET match_date = $1, match_time = $2, 
                            home_team = $3, away_team = $4, 
                            location = $5, home_score = $6, away_score = $7,
                            home_team_logo = $8, away_team_logo = $9, 
                            status = $10, last_updated = CURRENT_TIMESTAMP
                        WHERE team_id = $11 AND round = $12
                    `, [
                        match.date, match.time,
                        match.homeTeam, match.awayTeam,
                        match.location, match.homeScore, match.awayScore,
                        match.homeTeamLogo, match.awayTeamLogo,
                        match.status, teamId, match.round
                    ]);
                    updatedMatches++;
                } else {
                    // Insertar nuevo partido
                    await pool.query(`
                        INSERT INTO fecan_matches 
                        (team_id, round, match_date, match_time, home_team, away_team, 
                         location, home_score, away_score, home_team_logo, away_team_logo, status)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    `, [
                        teamId, match.round, match.date, match.time,
                        match.homeTeam, match.awayTeam, match.location,
                        match.homeScore, match.awayScore,
                        match.homeTeamLogo, match.awayTeamLogo,
                        match.status
                    ]);
                    newMatches++;
                }
            } catch (err) {
                console.error(`❌ Error guardando partido jornada ${match.round}:`, err.message);
                errors++;
            }
        }

        const stats = {
            team: config.name,
            total: matches.length,
            new: newMatches,
            updated: updatedMatches,
            errors: errors
        };

        console.log(`✅ ${config.name}: ${newMatches} nuevos, ${updatedMatches} actualizados, ${errors} errores`);
        
        return stats;

    } catch (error) {
        console.error(`❌ Error importando ${config.name}:`, error.message);
        return { error: error.message, team: config.name };
    }
}

/**
 * Ejecuta la importación automática para todos los equipos configurados
 * @param {Object} pool - Pool de conexión PostgreSQL
 * @returns {Promise<Object>} - Resumen de todas las importaciones
 */
async function runAutoImport(pool) {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  🤖 IMPORTACIÓN AUTOMÁTICA FECAN                     ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`⏰ Fecha: ${new Date().toLocaleString('es-ES')}\n`);

    const results = {};

    // Importar todos los equipos configurados
    for (const teamId of Object.keys(TEAMS_CONFIG)) {
        results[teamId] = await importTeamMatches(pool, teamId);
        // Pequeña pausa entre equipos para no saturar
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Resumen final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RESUMEN DE IMPORTACIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const [teamId, stats] of Object.entries(results)) {
        if (stats.skipped) {
            console.log(`⏭️  ${teamId}: Deshabilitado`);
        } else if (stats.error) {
            console.log(`❌ ${stats.team || teamId}: ${stats.error}`);
        } else {
            console.log(`✅ ${stats.team}: ${stats.new} nuevos, ${stats.updated} actualizados (Total: ${stats.total})`);
        }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return results;
}

/**
 * Guarda un log de la importación en la base de datos
 */
async function saveImportLog(pool, results) {
    try {
        const logData = JSON.stringify(results);
        await pool.query(`
            INSERT INTO fecan_import_logs (import_date, results, status)
            VALUES (CURRENT_TIMESTAMP, $1, $2)
        `, [logData, 'success']);
    } catch (err) {
        console.error('⚠️ No se pudo guardar el log (tabla fecan_import_logs no existe)');
    }
}

module.exports = {
    runAutoImport,
    importTeamMatches,
    TEAMS_CONFIG
};
