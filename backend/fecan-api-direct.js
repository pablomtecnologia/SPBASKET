// fecan-api-direct.js - Llamada directa a la API de OptimalWay CloudFront
const axios = require('axios');

/**
 * Configuración de competiciones
 */
const COMPETITIONS_CONFIG = {
    'sp-rosa': {
        competitionId: 1674,
        name: 'SP ROSA'
    },
    'sp-negro': {
        competitionId: 1675,
        name: 'SP NEGRO'
    }
};

/**
 * Obtiene el calendario completo de una competición desde la API
 */
async function getCompetitionData(competitionId) {
    const apiUrl = `https://d206q8529sjqpk.cloudfront.net/recursos/competicions/${competitionId}/calendari.json`;

    console.log(`📡 Llamando API: ${apiUrl}`);

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        if (response.data && Array.isArray(response.data)) {
            console.log(`✅ API respondió: ${response.data.length} partidos`);
            return response.data;
        }

        return [];
    } catch (error) {
        console.error(`❌ Error en API: ${error.message}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }
        throw error;
    }
}

/**
 * Obtiene la clasificación de una competición
 */
async function getClassification(competitionId) {
    const apiUrl = `https://d206q8529sjqpk.cloudfront.net/recursos/competicions/${competitionId}/classificacio.json`;

    console.log(`📊 Obteniendo clasificación: ${apiUrl}`);

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        if (response.data && Array.isArray(response.data)) {
            console.log(`✅ Clasificación obtenida: ${response.data.length} equipos`);
            return response.data;
        }

        return [];
    } catch (error) {
        console.log(`⚠️  Clasificación no disponible: ${error.message}`);
        return [];
    }
}

/**
 * Procesa y normaliza los datos de partidos
 */
function normalizeMatches(apiData) {
    return apiData.map((match, index) => ({
        jornada: match.jornada || match.round || (index + 1).toString(),
        fecha: match.data || match.fecha || match.date || '',
        hora: match.hora || match.time || '',
        equipoLocal: match.equipLocal || match.homeTeam || match.local || '',
        equipoVisitante: match.equipVisitant || match.awayTeam || match.visitante || '',
        resultadoLocal: match.resultatLocal !== null && match.resultatLocal !== undefined ?
            parseInt(match.resultatLocal) : null,
        resultadoVisitante: match.resultatVisitant !== null && match.resultatVisitant !== undefined ?
            parseInt(match.resultatVisitant) : null,
        pabellon: match.pabellio || match.pavilion || match.location || '',
        logoLocal: match.logoLocal || '',
        logoVisitante: match.logoVisitant || '',
        estado: (match.resultatLocal !== null && match.resultatLocal !== undefined) ? 'played' : 'upcoming'
    }));
}

/**
 * Procesa clasificación
 */
function normalizeClassification(apiData) {
    return apiData.map((team, index) => ({
        position: team.posicio || team.position || (index + 1).toString(),
        team: team.equip || team.team || '',
        played: team.partitsJugats || team.played || 0,
        won: team.partitsGuanyats || team.won || 0,
        lost: team.partitsPerduts || team.lost || 0,
        pointsFor: team.puntsAfavor || team.pointsFor || 0,
        pointsAgainst: team.puntsEncontra || team.pointsAgainst || 0,
        pointsDiff: (team.puntsAfavor || 0) - (team.puntsEncontra || 0),
        points: team.punts || team.points || 0,
        logo: team.logo || ''
    }));
}

/**
 * Obtiene TODOS los datos de una competición
 */
async function scrapeAll(teamId) {
    const config = COMPETITIONS_CONFIG[teamId];
    if (!config) throw new Error(`Equipo ${teamId} no configurado`);

    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║  🤖 OBTENIENDO DATOS FECAN - ${config.name}  ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);

    try {
        // Obtener datos en paralelo
        const [matchesData, classData] = await Promise.all([
            getCompetitionData(config.competitionId),
            getClassification(config.competitionId)
        ]);

        const partidos = normalizeMatches(matchesData);
        const clasificacion = normalizeClassification(classData);

        const completeData = {
            teamId,
            name: config.name,
            competitionId: config.competitionId,
            clasificacion,
            partidos,
            fotos: [], // Las fotos requieren scraping HTML
            lastUpdated: new Date().toISOString()
        };

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMEN DE DATOS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🏆 Equipos en clasificación: ${clasificacion.length}`);
        console.log(`⚽ Partidos obtenidos: ${partidos.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return completeData;

    } catch (error) {
        console.error('❌ Error obteniendo datos:', error.message);
        throw error;
    }
}

module.exports = {
    scrapeAll,
    getCompetitionData,
    getClassification,
    COMPETITIONS_CONFIG
};
