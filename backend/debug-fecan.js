// debug-fecan.js - Script para debuggear la página de FECAN
const axios = require('axios');

async function debugFecan() {
    console.log('🔍 Investigando estructura de FECAN...\n');

    const testUrls = [
        'https://www.fecanbaloncesto.com/equipo/?id=4046',
        'https://d206q8529sjqpk.cloudfront.net/recursos/equips/4046/calendari.json',
    ];

    for (const url of testUrls) {
        console.log(`\n📡 Probando: ${url}`);
        console.log('─'.repeat(80));

        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            console.log(`✅ Status: ${response.status}`);
            console.log(`📊 Content-Type: ${response.headers['content-type']}`);

            if (url.includes('.json')) {
                // Es JSON
                console.log(`📄 JSON Response (primeros 500 chars):`);
                const jsonStr = JSON.stringify(response.data, null, 2);
                console.log(jsonStr.substring(0, 500));

                if (Array.isArray(response.data)) {
                    console.log(`\n📊 Total items en array: ${response.data.length}`);
                    if (response.data.length > 0) {
                        console.log('\n🔍 Primer elemento completo:');
                        console.log(JSON.stringify(response.data[0], null, 2));
                    }
                }
            } else {
                // Es HTML
                console.log(`📄 HTML Response (primeros 1000 chars):`);
                console.log(response.data.substring(0, 1000));

                // Buscar palabras clave
                const keywords = ['partido', 'jornada', 'calendario', 'match', 'game', 'round'];
                console.log('\n🔍 Palabras clave encontradas:');
                keywords.forEach(kw => {
                    const count = (response.data.match(new RegExp(kw, 'gi')) || []).length;
                    if (count > 0) console.log(`  - "${kw}": ${count} veces`);
                });
            }

        } catch (error) {
            if (error.response) {
                console.log(`❌ Error HTTP ${error.response.status}: ${error.response.statusText}`);
            } else if (error.code === 'ECONNABORTED') {
                console.log('❌ Timeout - La solicitud tardó demasiado');
            } else {
                console.log(`❌ Error: ${error.message}`);
            }
        }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Debug completado');
}

debugFecan();
