// fecan-scraper-axios.js - Scraper de FECAN usando Axios + Cheerio (sin Puppeteer)
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Configuración de competiciones
 */
const COMPETITIONS_CONFIG = {
    'sp-rosa': {
        competitionId: 1674,
        name: 'SP ROSA',
        urlClasificacion: 'https://www.fecanbaloncesto.com/competicion/?id=1674',
        urlResultados: 'https://www.fecanbaloncesto.com/competicion/?id=1674&round=0'
    },
    'sp-negro': {
        competitionId: 1675,
        name: 'SP NEGRO',
        urlClasificacion: 'https://www.fecanbaloncesto.com/competicion/?id=1675',
        urlResultados: 'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0'
    }
};

/**
 * Headers para simular navegador real
 */
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
};

/**
 * Intenta obtener datos de la API JSON de OptimalWay
 */
async function tryOptimalWayAPI(competitionId) {
    try {
        const apiUrl = `https://d206q8529sjqpk.cloudfront.net/recursos/competicions/${competitionId}/calendari.json`;
        console.log(`📡 Intentando API OptimalWay: ${apiUrl}`);

        const response = await axios.get(apiUrl, {
            headers: BROWSER_HEADERS,
            timeout: 10000
        });

        if (response.data && response.data.length > 0) {
            console.log(`✅ API disponible: ${response.data.length} partidos`);
            return response.data;
        }
    } catch (error) {
        console.log(`⚠️ API no disponible: ${error.message}`);
    }
    return null;
}

/**
 * Scrapea HTML de la página
 */
async function scrapeHTML(url) {
    console.log(`🌐 Descargando HTML de: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: BROWSER_HEADERS,
            timeout: 15000,
            maxRedirects: 5
        });

        return cheerio.load(response.data);
    } catch (error) {
        console.error(`❌ Error descargando HTML: ${error.message}`);
        throw error;
    }
}

/**
 * Scrapea la clasificación
 */
async function scrapeClasificacion(teamId) {
    const config = COMPETITIONS_CONFIG[teamId];
    if (!config) throw new Error(`Equipo ${teamId} no configurado`);

    console.log(`\n🏆 Scrapeando clasificación de ${config.name}...`);

    const $ = await scrapeHTML(config.urlClasificacion);
    const clasificacion = [];

    // Buscar todas las tablas
    $('table').each((i, table) => {
        const $table = $(table);
        const headerText = $table.find('thead th, tr:first-child th').text().toLowerCase();

        // Verificar si es la tabla de clasificación
        if (headerText.includes('pos') || headerText.includes('equipo') || headerText.includes('pts')) {
            console.log(`📊 Tabla de clasificación encontrada (tabla ${i + 1})`);

            $table.find('tbody tr, tr').each((index, row) => {
                const $row = $(row);
                const cells = $row.find('td');

                if (cells.length >= 5) {
                    const rowData = {
                        position: $(cells[0]).text().trim() || (index + 1).toString(),
                        team: $(cells[1]).text().trim(),
                        played: $(cells[2]).text().trim() || '0',
                        won: $(cells[3]).text().trim() || '0',
                        lost: $(cells[4]).text().trim() || '0',
                        pointsFor: $(cells[5]) ? $(cells[5]).text().trim() : '0',
                        pointsAgainst: $(cells[6]) ? $(cells[6]).text().trim() : '0',
                        pointsDiff: $(cells[7]) ? $(cells[7]).text().trim() : '0',
                        points: $(cells[8]) ? $(cells[8]).text().trim() : $(cells[cells.length - 1]).text().trim()
                    };

                    if (rowData.team && rowData.team !== 'Equipo' && rowData.team.length > 2) {
                        clasificacion.push(rowData);
                    }
                }
            });
        }
    });

    // Extraer título de competición
    const title = $('h1, .titulo-competicion, .competition-title').first().text().trim() ||
        `Competición ${config.name}`;

    console.log(`✅ Clasificación: ${clasificacion.length} equipos`);

    return {
        teamId,
        competitionInfo: {
            title,
            season: '2025/2026'
        },
        clasificacion,
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Scrapea los resultados
 */
async function scrapeResultados(teamId) {
    const config = COMPETITIONS_CONFIG[teamId];
    if (!config) throw new Error(`Equipo ${teamId} no configurado`);

    console.log(`\n⚽ Scrapeando resultados de ${config.name}...`);

    // Intentar primero con API
    const apiData = await tryOptimalWayAPI(config.competitionId);
    if (apiData) {
        const partidos = apiData.map((match, index) => ({
            jornada: match.jornada || match.round || `J${index + 1}`,
            fecha: match.data || match.fecha || match.date || '',
            hora: match.hora || match.time || '',
            equipoLocal: match.equipLocal || match.homeTeam || match.local || '',
            equipoVisitante: match.equipVisitant || match.awayTeam || match.visitante || '',
            resultadoLocal: match.resultatLocal !== undefined ? parseInt(match.resultatLocal) : null,
            resultadoVisitante: match.resultatVisitant !== undefined ? parseInt(match.resultatVisitant) : null,
            pabellon: match.pabellio || match.pavilion || match.location || '',
            estado: (match.resultatLocal !== null && match.resultatLocal !== undefined) ? 'played' : 'upcoming'
        }));

        console.log(`✅ Resultados de API: ${partidos.length} partidos`);

        return {
            teamId,
            partidos,
            fotos: [],
            lastUpdated: new Date().toISOString()
        };
    }

    // Si API falla, scrapear HTML
    const $ = await scrapeHTML(config.urlResultados);
    const partidos = [];
    const fotos = [];

    // Buscar partidos en divs
    $('.partido, .match, .game, .jornada-partido').each((i, match) => {
        const $match = $(match);

        const jornada = $match.find('.jornada, .round, .journee').text().trim() || `J${i + 1}`;
        const fecha = $match.find('.fecha, .date, .data').text().trim();
        const hora = $match.find('.hora, .time, .hour').text().trim();
        const local = $match.find('.equipo-local, .home-team, .local, .team-home').text().trim();
        const visitante = $match.find('.equipo-visitante, .away-team, .visitor, .team-away').text().trim();
        const resultado = $match.find('.resultado, .score, .result').text().trim();
        const pabellon = $match.find('.pabellon, .venue, .location').text().trim();

        let resultadoLocal = null;
        let resultadoVisitante = null;
        let estado = 'upcoming';

        const scoreMatch = resultado.match(/(\d+)\s*-\s*(\d+)/);
        if (scoreMatch) {
            resultadoLocal = parseInt(scoreMatch[1]);
            resultadoVisitante = parseInt(scoreMatch[2]);
            estado = 'played';
        }

        if (local && visitante) {
            partidos.push({
                jornada,
                fecha,
                hora,
                equipoLocal: local,
                equipoVisitante: visitante,
                resultadoLocal,
                resultadoVisitante,
                pabellon,
                estado
            });
        }
    });

    // Si no hay partidos en divs, buscar en tabla
    if (partidos.length === 0) {
        $('table').each((i, table) => {
            const $table = $(table);
            $table.find('tbody tr, tr').each((index, row) => {
                const $row = $(row);
                const cells = $row.find('td');

                if (cells.length >= 4) {
                    const jornada = $(cells[0]).text().trim() || `J${index + 1}`;
                    const fecha = $(cells[1]).text().trim();
                    const local = $(cells[2]).text().trim();
                    const resultadoText = $(cells[3]).text().trim();
                    const visitante = $(cells[4]).text().trim();
                    const pabellon = $(cells[5]) ? $(cells[5]).text().trim() : '';

                    let resultadoLocal = null;
                    let resultadoVisitante = null;
                    let estado = 'upcoming';

                    const scoreMatch = resultadoText.match(/(\d+)\s*-\s*(\d+)/);
                    if (scoreMatch) {
                        resultadoLocal = parseInt(scoreMatch[1]);
                        resultadoVisitante = parseInt(scoreMatch[2]);
                        estado = 'played';
                    }

                    if (local && visitante && local.length > 2) {
                        partidos.push({
                            jornada,
                            fecha,
                            hora: '',
                            equipoLocal: local,
                            equipoVisitante: visitante,
                            resultadoLocal,
                            resultadoVisitante,
                            pabellon,
                            estado
                        });
                    }
                }
            });
        });
    }

    // Buscar fotos
    $('img[src*="foto"], img[src*="image"], img[src*="gallery"], .galeria img, .gallery img').each((i, img) => {
        const src = $(img).attr('src');
        const alt = $(img).attr('alt') || '';

        if (src && !src.includes('logo') && !src.includes('icon')) {
            // Convertir URLs relativas a absolutas
            const fullSrc = src.startsWith('http') ? src : `https://www.fecanbaloncesto.com${src}`;
            fotos.push({ src: fullSrc, alt });
        }
    });

    console.log(`✅ Resultados scrapeados: ${partidos.length} partidos`);
    console.log(`📸 Fotos encontradas: ${fotos.length}`);

    return {
        teamId,
        partidos,
        fotos,
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Scrapea TODO
 */
async function scrapeAll(teamId) {
    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║  🤖 SCRAPING COMPLETO FECAN - ${COMPETITIONS_CONFIG[teamId]?.name || teamId}  ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);

    try {
        const [clasificacionData, resultadosData] = await Promise.all([
            scrapeClasificacion(teamId),
            scrapeResultados(teamId)
        ]);

        const completeData = {
            teamId,
            name: COMPETITIONS_CONFIG[teamId].name,
            clasificacion: clasificacionData.clasificacion,
            competicionInfo: clasificacionData.competitionInfo,
            partidos: resultadosData.partidos,
            fotos: resultadosData.fotos,
            lastUpdated: new Date().toISOString()
        };

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMEN DEL SCRAPING:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🏆 Equipos en clasificación: ${completeData.clasificacion.length}`);
        console.log(`⚽ Partidos encontrados: ${completeData.partidos.length}`);
        console.log(`📸 Fotos encontradas: ${completeData.fotos.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return completeData;

    } catch (error) {
        console.error('❌ Error en scraping completo:', error);
        throw error;
    }
}

module.exports = {
    scrapeClasificacion,
    scrapeResultados,
    scrapeAll,
    COMPETITIONS_CONFIG
};
