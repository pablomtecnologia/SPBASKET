// scraper-fecan.js - Servicio de scraping para importar partidos desde FECAN
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapea la página de FECAN para un equipo específico
 * @param {number} teamId - ID del equipo en FECAN (ej: 4046)
 * @returns {Promise<Array>} - Array de partidos con toda la información
 */
async function scrapeFecanMatches(teamId) {
    try {
        const url = `https://www.fecanbaloncesto.com/equipo/?id=${teamId}`;
        console.log(`🔍 Scraping FECAN para equipo ID ${teamId}: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const matches = [];

        // Buscar todas las filas de partidos
        // La estructura puede variar, aquí hay que ajustar según la estructura real de FECAN
        $('.partido, tr.match-row, .match-item').each((index, element) => {
            try {
                const $el = $(element);

                // Extraer datos del partido
                // NOTA: Estos selectores deben ajustarse según la estructura real de la página
                const match = {
                    round: extractNumber($el.find('.jornada, .round').text()) || index + 1,
                    date: extractDate($el.find('.fecha, .date').text()),
                    time: extractTime($el.find('.hora, .time').text()),
                    homeTeam: cleanTeamName($el.find('.equipo-local, .home-team').text()),
                    awayTeam: cleanTeamName($el.find('.equipo-visitante, .away-team').text()),
                    location: cleanText($el.find('.pabellon, .location, .venue').text()),
                    homeScore: extractNumber($el.find('.resultado-local, .home-score').text()),
                    awayScore: extractNumber($el.find('.resultado-visitante, .away-score').text()),
                    homeTeamLogo: extractLogo($el.find('.logo-local, .home-logo')),
                    awayTeamLogo: extractLogo($el.find('.logo-visitante, .away-logo')),
                    status: determineStatus($el, extractDate($el.find('.fecha, .date').text()))
                };

                // Solo agregar si tiene información mínima válida
                if (match.homeTeam && match.awayTeam) {
                    matches.push(match);
                }
            } catch (err) {
                console.warn(`⚠️ Error procesando partido ${index}:`, err.message);
            }
        });

        console.log(`✅ Scraped ${matches.length} partidos desde FECAN`);
        return matches;

    } catch (error) {
        console.error('❌ Error scraping FECAN:', error.message);
        throw error;
    }
}

/**
 * Scraping alternativo usando API interna de FECAN si existe
 * Muchas federaciones usan OptimalWay que tiene una API JSON
 */
async function scrapeFecanAPI(teamId) {
    try {
        // Intentar con endpoint de API
        const apiUrl = `https://d206q8529sjqpk.cloudfront.net/recursos/equips/${teamId}/calendari.json`;
        console.log(`🔍 Intentando API FECAN: ${apiUrl}`);

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (response.data && Array.isArray(response.data)) {
            const matches = response.data.map((match, index) => ({
                round: match.jornada || match.round || index + 1,
                date: formatDate(match.data || match.fecha || match.date),
                time: formatTime(match.hora || match.time || ''),
                homeTeam: cleanTeamName(match.equipLocal || match.homeTeam || match.local),
                awayTeam: cleanTeamName(match.equipVisitant || match.awayTeam || match.visitante),
                location: cleanText(match.pabellio || match.pavilion || match.location || ''),
                homeScore: match.resultatLocal ?? match.homeScore ?? null,
                awayScore: match.resultatVisitant ?? match.awayScore ?? null,
                homeTeamLogo: match.logoLocal || match.homeLogo || '',
                awayTeamLogo: match.logoVisitant || match.awayLogo || '',
                status: match.resultatLocal !== null && match.resultatLocal !== undefined ? 'played' : 'upcoming'
            }));

            console.log(`✅ API FECAN: ${matches.length} partidos obtenidos`);
            return matches;
        }

        return [];
    } catch (error) {
        console.log(`⚠️ API FECAN no disponible: ${error.message}`);
        return null;
    }
}

/**
 * Función principal que intenta primero con API y luego con scraping HTML
 */
async function getFecanMatches(teamId) {
    // Primero intentar con API
    const apiMatches = await scrapeFecanAPI(teamId);
    if (apiMatches && apiMatches.length > 0) {
        return apiMatches;
    }

    // Si API falla, hacer scraping HTML tradicional
    return await scrapeFecanMatches(teamId);
}

// ============ FUNCIONES AUXILIARES ============

function extractNumber(text) {
    if (!text) return null;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
}

function extractDate(text) {
    if (!text) return '';
    // Limpiar y normalizar fecha
    // Formato esperado: "05/10/2025" o similar
    const cleaned = text.trim().replace(/\s+/g, ' ');
    return cleaned;
}

function extractTime(text) {
    if (!text) return '';
    // Extraer hora en formato HH:MM
    const match = text.match(/(\d{1,2}):(\d{2})/);
    return match ? match[0] : '';
}

function cleanTeamName(text) {
    if (!text) return '';
    return text.trim()
        .replace(/\s+/g, ' ')
        .toUpperCase();
}

function cleanText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
}

function extractLogo(element) {
    // Intentar extraer URL de imagen
    if (!element || !element.attr) return '';

    const src = element.attr('src') || element.find('img').attr('src') || '';

    // Si es URL relativa, convertir a absoluta
    if (src && src.startsWith('/')) {
        return `https://www.fecanbaloncesto.com${src}`;
    }

    return src;
}

function determineStatus(element, dateStr) {
    // Si hay resultado, está jugado
    const hasScore = element.find('.resultado, .score').length > 0;
    if (hasScore) return 'played';

    // Si no, verificar si la fecha es futura
    try {
        const matchDate = parseSpanishDate(dateStr);
        const now = new Date();
        return matchDate > now ? 'upcoming' : 'played';
    } catch {
        return 'upcoming';
    }
}

function parseSpanishDate(dateStr) {
    // Parsear fecha en formato español "DD/MM/YYYY"
    if (!dateStr) return new Date();

    const parts = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!parts) return new Date();

    const [, day, month, year] = parts;
    return new Date(year, month - 1, day);
}

function formatDate(dateStr) {
    if (!dateStr) return '';

    // Si ya está en formato DD/MM/YYYY, devolverlo
    if (dateStr.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
        return dateStr;
    }

    // Si es ISO, convertir
    try {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
}

function formatTime(timeStr) {
    if (!timeStr) return '';

    // Normalizar formato de hora
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return timeStr;

    const [, hours, minutes] = match;
    return `${hours.padStart(2, '0')}:${minutes}`;
}

module.exports = {
    getFecanMatches,
    scrapeFecanMatches,
    scrapeFecanAPI
};
