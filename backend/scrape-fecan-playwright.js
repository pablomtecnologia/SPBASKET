// scrape-fecan-playwright.js - Scraper usando Playwright (mejor que Puppeteer en Windows)
const { chromium } = require('playwright');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

const COMPETITIONS = {
    'sp-rosa': {
        id: 1674,
        url: 'https://www.fecanbaloncesto.com/competicion/?id=1674&round=0',
        name: 'SP ROSA'
    },
    'sp-negro': {
        id: 1675,
        url: 'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0',
        name: 'SP NEGRO'
    }
};

async function scrapeWithPlaywright(teamId) {
    console.log(`\n🚀 Scrapeando ${COMPETITIONS[teamId].name}...`);

    let browser;
    try {
        browser = await chromium.launch({
            headless: true
        });

        const page = await browser.newPage();
        await page.goto(COMPETITIONS[teamId].url, { waitUntil: 'networkidle' });

        console.log('✅ Página cargada');

        // Esperar a que se cargue el contenido
        await page.waitForTimeout(3000);

        // Extraer clasificación
        const clasificacion = await page.evaluate(() => {
            const rows = [];
            const table = document.querySelector('table');
            if (table) {
                const trs = table.querySelectorAll('tbody tr');
                trs.forEach((tr, index) => {
                    const tds = tr.querySelectorAll('td');
                    if (tds.length >= 8) {
                        rows.push({
                            position: index + 1,
                            team_name: tds[1]?.textContent.trim() || '',
                            played: parseInt(tds[2]?.textContent.trim()) || 0,
                            won: parseInt(tds[3]?.textContent.trim()) || 0,
                            lost: parseInt(tds[4]?.textContent.trim()) || 0,
                            points_for: parseInt(tds[5]?.textContent.trim()) || 0,
                            points_against: parseInt(tds[6]?.textContent.trim()) || 0,
                            points: parseInt(tds[7]?.textContent.trim()) || 0
                        });
                    }
                });
            }
            return rows;
        });

        console.log(`📊 Clasificación: ${clasificacion.length} equipos`);

        // Extraer partidos
        const partidos = await page.evaluate(() => {
            const matches = [];
            const matchDivs = document.querySelectorAll('.partido, .match, .game');
            matchDivs.forEach(div => {
                // Intentar extraer información del partido
                const text = div.textContent;
                // Aquí necesitarías adaptar según la estructura real de FECAN
                matches.push({
                    text: text.trim()
                });
            });
            return matches;
        });

        console.log(`⚽ Partidos encontrados: ${partidos.length}`);

        // Guardar en BD
        if (clasificacion.length > 0) {
            await saveClasificacion(teamId, clasificacion);
        }

        return { clasificacion, partidos };

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

async function saveClasificacion(teamId, clasificacion) {
    const client = await pool.connect();
    try {
        // Limpiar clasificación anterior
        await client.query('DELETE FROM fecan_clasificacion WHERE team_id = $1', [teamId]);

        // Insertar nueva
        for (const team of clasificacion) {
            const diff = team.points_for - team.points_against;
            await client.query(`
                INSERT INTO fecan_clasificacion 
                (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [teamId, team.position, team.team_name, team.played, team.won, team.lost,
                team.points_for, team.points_against, diff, team.points]);
        }

        console.log(`✅ Guardados ${clasificacion.length} equipos en la BD`);
    } finally {
        client.release();
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         🏀 SCRAPING REAL DE FECAN CON PLAYWRIGHT          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    try {
        await scrapeWithPlaywright('sp-rosa');
        await scrapeWithPlaywright('sp-negro');

        console.log('\n✅ SCRAPING COMPLETADO!\n');
    } catch (error) {
        console.error('\n❌ Error general:', error.message);
    } finally {
        await pool.end();
    }
}

main();
