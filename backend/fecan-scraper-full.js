// fecan-scraper-full.js - Scraper completo de FECAN con Puppeteer
const puppeteer = require('puppeteer');

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
 * Scrapea la tabla de clasificación de una competición
 */
async function scrapeClasificacion(teamId) {
    const config = COMPETITIONS_CONFIG[teamId];
    if (!config) throw new Error(`Equipo ${teamId} no configurado`);

    console.log(`\n🏆 Scrapeando clasificación de ${config.name}...`);
    console.log(`📍 URL: ${config.urlClasificacion}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        // Navegar a la página
        await page.goto(config.urlClasificacion, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Esperar a que la tabla de clasificación cargue
        await page.waitForSelector('table, .tabla-clasificacion, .clasificacion', { timeout: 10000 });

        // Extraer datos de la tabla de clasificación
        const clasificacion = await page.evaluate(() => {
            const rows = [];

            // Buscar la tabla de clasificación (puede tener diferentes selectores)
            const tables = document.querySelectorAll('table');
            let clasificacionTable = null;

            // Encontrar la tabla correcta (la que tiene encabezados de clasificación)
            for (const table of tables) {
                const text = table.innerText.toLowerCase();
                if (text.includes('pos') || text.includes('equipo') || text.includes('pts') || text.includes('puntos')) {
                    clasificacionTable = table;
                    break;
                }
            }

            if (!clasificacionTable) return [];

            const tableRows = clasificacionTable.querySelectorAll('tbody tr, tr');

            tableRows.forEach((row, index) => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length > 3) { // Tiene datos suficientes
                    const rowData = {
                        position: cells[0]?.innerText.trim() || (index + 1).toString(),
                        team: cells[1]?.innerText.trim() || '',
                        played: cells[2]?.innerText.trim() || '0',
                        won: cells[3]?.innerText.trim() || '0',
                        lost: cells[4]?.innerText.trim() || '0',
                        pointsFor: cells[5]?.innerText.trim() || '0',
                        pointsAgainst: cells[6]?.innerText.trim() || '0',
                        pointsDiff: cells[7]?.innerText.trim() || '0',
                        points: cells[8]?.innerText.trim() || cells[cells.length - 1]?.innerText.trim() || '0'
                    };

                    if (rowData.team && rowData.team !== 'Equipo') {
                        rows.push(rowData);
                    }
                }
            });

            return rows;
        });

        // Extraer información general de la competición
        const competicionInfo = await page.evaluate(() => {
            const titleElement = document.querySelector('h1, .competition-title, .titulo-competicion');
            const title = titleElement ? titleElement.innerText.trim() : '';

            return {
                title: title,
                season: '2025/2026' // Ajustar según necesidad
            };
        });

        console.log(`✅ Clasificación obtenida: ${clasificacion.length} equipos`);

        return {
            teamId,
            competitionInfo,
            clasificacion,
            lastUpdated: new Date().toISOString()
        };

    } catch (error) {
        console.error(`❌ Error scrapeando clasificación de ${config.name}:`, error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

/**
 * Scrapea los resultados de partidos de una competición
 */
async function scrapeResultados(teamId) {
    const config = COMPETITIONS_CONFIG[teamId];
    if (!config) throw new Error(`Equipo ${teamId} no configurado`);

    console.log(`\n⚽ Scrapeando resultados de ${config.name}...`);
    console.log(`📍 URL: ${config.urlResultados}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        // Navegar a la página
        await page.goto(config.urlResultados, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Esperar a que los partidos carguen
        await page.waitForSelector('.partido, .match, table', { timeout: 10000 });

        // Extraer datos de partidos
        const partidos = await page.evaluate(() => {
            const matches = [];

            // Buscar partidos (pueden estar en divs o tabla)
            const matchElements = document.querySelectorAll('.partido, .match, .game');

            matchElements.forEach((match, index) => {
                try {
                    const jornada = match.querySelector('.jornada, .round, .journee')?.innerText.trim() || `J${index + 1}`;
                    const fecha = match.querySelector('.fecha, .date, .data')?.innerText.trim() || '';
                    const hora = match.querySelector('.hora, .time, .hour')?.innerText.trim() || '';
                    const local = match.querySelector('.equipo-local, .home-team, .local')?.innerText.trim() || '';
                    const visitante = match.querySelector('.equipo-visitante, .away-team, .visitor')?.innerText.trim() || '';
                    const resultadoEl = match.querySelector('.resultado, .score, .result');
                    const pabellon = match.querySelector('.pabellon, .venue, .location')?.innerText.trim() || '';

                    let resultadoLocal = null;
                    let resultadoVisitante = null;
                    let estado = 'upcoming';

                    if (resultadoEl) {
                        const resultado = resultadoEl.innerText.trim();
                        const scoreMatch = resultado.match(/(\d+)\s*-\s*(\d+)/);
                        if (scoreMatch) {
                            resultadoLocal = parseInt(scoreMatch[1]);
                            resultadoVisitante = parseInt(scoreMatch[2]);
                            estado = 'played';
                        }
                    }

                    if (local && visitante) {
                        matches.push({
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
                } catch (err) {
                    console.warn('Error procesando partido:', err.message);
                }
            });

            // Si no encontró partidos en divs, buscar en tabla
            if (matches.length === 0) {
                const tables = document.querySelectorAll('table');
                tables.forEach(table => {
                    const rows = table.querySelectorAll('tbody tr, tr');
                    rows.forEach((row, index) => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 4) {
                            const matchData = {
                                jornada: cells[0]?.innerText.trim() || `J${index + 1}`,
                                fecha: cells[1]?.innerText.trim() || '',
                                equipoLocal: cells[2]?.innerText.trim() || '',
                                equipoVisitante: cells[4]?.innerText.trim() || '',
                                pabellon: cells[5]?.innerText.trim() || '',
                                estado: 'upcoming',
                                resultadoLocal: null,
                                resultadoVisitante: null
                            };

                            // Buscar resultado
                            const resultCell = cells[3]?.innerText.trim() || '';
                            const scoreMatch = resultCell.match(/(\d+)\s*-\s*(\d+)/);
                            if (scoreMatch) {
                                matchData.resultadoLocal = parseInt(scoreMatch[1]);
                                matchData.resultadoVisitante = parseInt(scoreMatch[2]);
                                matchData.estado = 'played';
                            }

                            if (matchData.equipoLocal && matchData.equipoVisitante) {
                                matches.push(matchData);
                            }
                        }
                    });
                });
            }

            return matches;
        });

        // Extraer fotos/galería
        const fotos = await page.evaluate(() => {
            const images = [];
            const imgElements = document.querySelectorAll('img[src*="foto"], img[src*="image"], img[src*="gallery"], .galeria img, .gallery img');

            imgElements.forEach(img => {
                const src = img.src;
                const alt = img.alt || '';
                if (src && !src.includes('logo') && !src.includes('icon')) {
                    images.push({ src, alt });
                }
            });

            return images;
        });

        console.log(`✅ Resultados obtenidos: ${partidos.length} partidos`);
        console.log(`📸 Fotos encontradas: ${fotos.length}`);

        return {
            teamId,
            partidos,
            fotos,
            lastUpdated: new Date().toISOString()
        };

    } catch (error) {
        console.error(`❌ Error scrapeando resultados de ${config.name}:`, error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

/**
 * Scrapea TODO: clasificación, resultados y fotos
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
