// scrape-fecan-real.js - Intenta scrapear datos reales de FECAN
const axios = require('axios');
const cheerio = require('cheerio');

const URLS = {
    'sp-negro': 'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0',
    'sp-rosa': 'https://www.fecanbaloncesto.com/competicion/?id=1674&round=0'
};

// Headers completos para simular navegador real
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Referer': 'https://www.fecanbaloncesto.com/'
};

async function scrapeReal(teamId) {
    const url = URLS[teamId];
    console.log(`\n🔍 Intentando scrapear: ${url}\n`);

    try {
        const response = await axios.get(url, {
            headers: HEADERS,
            timeout: 15000,
            maxRedirects: 5,
            validateStatus: function (status) {
                return status < 500; // Acepta cualquier status < 500
            }
        });

        console.log(`✅ Status: ${response.status}`);
        console.log(`📄 Content-Type: ${response.headers['content-type']}`);
        console.log(`📦 Tamaño: ${response.data.length} bytes\n`);

        if (response.status === 403) {
            console.log('❌ Error 403: La página está bloqueando el acceso');
            console.log('💡 Razón: FECAN detecta que no es un navegador real\n');
            return null;
        }

        // Analizar HTML
        const $ = cheerio.load(response.data);

        console.log('📊 Analizando contenido HTML...\n');

        // Buscar scripts que puedan contener datos
        const scripts = $('script').map((i, el) => $(el).html()).get();
        const dataScripts = scripts.filter(s => s && (s.includes('partidos') || s.includes('clasificacion') || s.includes('jornada')));

        if (dataScripts.length > 0) {
            console.log(`✅ Encontrados ${dataScripts.length} scripts con posibles datos`);
            console.log('📝 Primeros 500 caracteres del script:');
            console.log(dataScripts[0].substring(0, 500));
        }

        // Buscar tablas
        const tables = $('table').length;
        console.log(`\n📋 Tablas encontradas: ${tables}`);

        // Buscar divs con clases relacionadas
        const partidoDivs = $('.partido, .match, .game, .jornada').length;
        console.log(`⚽ Divs de partidos encontrados: ${partidoDivs}`);

        const clasificacionDivs = $('.clasificacion, .standings, .tabla').length;
        console.log(`🏆 Divs de clasificación encontrados: ${clasificacionDivs}`);

        console.log(`\n📄 Guardando HTML completo en fecan-${teamId}.html para análisis...`);
        const fs = require('fs');
        fs.writeFileSync(`fecan-${teamId}.html`, response.data);
        console.log(`✅ Guardado en fecan-${teamId}.html`);

        return response.data;

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Headers:`, error.response.headers);
        }
        return null;
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     🔍 SCRAPING REAL DE FECAN - ANÁLISIS             ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    await scrapeReal('sp-negro');
    await scrapeReal('sp-rosa');

    console.log('\n' + '═'.repeat(60));
    console.log('📝 RESULTADO:');
    console.log('Los archivos HTML se guardaron para análisis.');
    console.log('Revisa fecan-sp-negro.html y fecan-sp-rosa.html');
    console.log('═'.repeat(60) + '\n');
}

main();
