// scrape-fecan-final.js - Último intento con esperas más largas
const { chromium } = require('playwright');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

async function scrapeFECAN(teamId, url, teamName) {
    console.log(`\n🚀 Scrapeando ${teamName}...`);
    console.log(`📍 URL: ${url}\n`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        console.log('✅ Página cargada');

        // Esperar 10 segundos para que JavaScript cargue todo
        console.log('⏳ Esperando 10 segundos para que cargue el JavaScript...');
        await page.waitForTimeout(10000);

        // Tomar screenshot para debug
        await page.screenshot({ path: `debug-${teamId}.png` });
        console.log(`📸 Screenshot guardado: debug-${teamId}.png`);

        // Intentar extraer TODO el texto visible
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log(`\n📄 Texto de la página (primeros 1000 caracteres):`);
        console.log(pageText.substring(0, 1000));
        console.log('\n' + '='.repeat(80) + '\n');

        // Buscar elementos de clasificación más agresivamente
        const clasificacion = await page.evaluate(() => {
            const teams = [];

            // Buscar en TODO el documento texto que parezca nombre de equipo
            const allText = document.body.innerText;
            const lines = allText.split('\n');

            // Patrón: buscar líneas con números que parezcan clasificación
            // Ejemplo: "1. Equipo A 10 8 2 200 180 16"
            lines.forEach((line, index) => {
                const trimmed = line.trim();
                // Si la línea tiene números al principio podría ser clasificación
                if (/^\d+\s+\w/.test(trimmed)) {
                    const next5Lines = lines.slice(index, index + 5).join(' | ');
                    teams.push({
                        rawText: trimmed,
                        context: next5Lines
                    });
                }
            });

            return teams;
        });

        console.log(`\n📊 Posibles líneas de clasificación encontradas: ${clasificacion.length}`);
        clasificacion.slice(0, 10).forEach((team, i) => {
            console.log(`  ${i + 1}. ${team.rawText}`);
        });

        // Si encontramos algo, guardar el HTML completo para análisis posterior
        if (clasificacion.length > 0) {
            const html = await page.content();
            const fs = require('fs');
            fs.writeFileSync(`fecan-${teamId}-full.html`, html);
            console.log(`\n💾 HTML completo guardado: fecan-${teamId}-full.html`);
        }

        return { clasificacion, pageText };

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        throw error;
    } finally {
        await browser.close();
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║      🏀 SCRAPING REAL DE FECAN - INTENTO FINAL           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    try {
        const rosaData = await scrapeFECAN(
            'sp-rosa',
            'https://www.fecanbaloncesto.com/competicion/?id=1674&round=0',
            'SP ROSA'
        );

        const negroData = await scrapeFECAN(
            'sp-negro',
            'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0',
            'SP NEGRO'
        );

        console.log('\n✅ SCRAPING COMPLETADO!');
        console.log('\nRevisa los archivos generados para análisis:');
        console.log('  - debug-sp-rosa.png');
        console.log('  - debug-sp-negro.png');
        console.log('  - fecan-sp-rosa-full.html');
        console.log('  - fecan-sp-negro-full.html\n');

    } catch (error) {
        console.error('\n❌ Error general:', error.message);
    } finally {
        await pool.end();
    }
}

main();
