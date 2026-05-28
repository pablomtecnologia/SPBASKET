// find-fecan-api.js - Busca la API real que usa FECAN
const axios = require('axios');

// URLs que FECAN podría estar usando para cargar datos
const POSSIBLE_APIS = [
    'https://d206q8529sjqpk.cloudfront.net/recursos/competicions/1675/calendari.json',
    'https://d206q8529sjqpk.cloudfront.net/recursos/competicions/1675/classificacio.json',
    'https://d206q8529sjqpk.cloudfront.net/recursos/competicions/1674/calendari.json',
    'https://d206q8529sjqpk.cloudfront.net/recursos/competicions/1674/classificacio.json',
    'https://api.fecanbaloncesto.com/competicions/1675/partits',
    'https://api.fecanbaloncesto.com/competicions/1674/partits',
];

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'es-ES,es;q=0.9',
    'Origin': 'https://www.fecanbaloncesto.com',
    'Referer': 'https://www.fecanbaloncesto.com/'
};

async function testAPI(url) {
    console.log(`\n🔍 Probando: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: HEADERS,
            timeout: 10000
        });

        console.log(`✅ FUNCIONA! Status: ${response.status}`);
        console.log(`📦 Tipo: ${response.headers['content-type']}`);

        if (response.data) {
            console.log(`📄 Datos recibidos (primeros 500 caracteres):`);
            const preview = JSON.stringify(response.data).substring(0, 500);
            console.log(preview);
            console.log(`\n💾 Total de datos: ${JSON.stringify(response.data).length} caracteres`);

            // Guardar datos completos
            const fs = require('fs');
            const filename = url.split('/').pop();
            fs.writeFileSync(filename, JSON.stringify(response.data, null, 2));
            console.log(`✅ Guardado en: ${filename}`);
        }

        return true;
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
        }
        return false;
    }
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║   🔎 BUSCANDO API REAL DE FECAN                      ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    let found = 0;
    for (const api of POSSIBLE_APIS) {
        const works = await testAPI(api);
        if (works) found++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 seg entre requests
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 RESULTADO: ${found} APIs funcionando de ${POSSIBLE_APIS.length} probadas`);
    console.log('═'.repeat(60) + '\n');
}

main();
