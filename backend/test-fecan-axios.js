// test-fecan-axios.js - Prueba del scraper con Axios
const { scrapeAll } = require('./fecan-scraper-axios');

async function test() {
    console.log('🧪 Probando scraper FECAN con Axios...\n');

    try {
        // Probar SP ROSA
        console.log('📍 Testeando SP ROSA...');
        const rosaData = await scrapeAll('sp-rosa');

        console.log('\n📄 RESUMEN SP ROSA:');
        console.log('Clasificación:', rosaData.clasificacion.slice(0, 3)); // Primeros 3
        console.log('Partidos:', rosaData.partidos.slice(0, 3)); // Primeros 3
        console.log('Total fotos:', rosaData.fotos.length);

        console.log('\n' + '═'.repeat(80) + '\n');

        // Probar SP NEGRO
        console.log('📍 Testeando SP NEGRO...');
        const negroData = await scrapeAll('sp-negro');

        console.log('\n📄 RESUMEN SP NEGRO:');
        console.log('Clasificación:', negroData.clasificacion.slice(0, 3));
        console.log('Partidos:', negroData.partidos.slice(0, 3));
        console.log('Total fotos:', negroData.fotos.length);

        console.log('\n✅ PRUEBA COMPLETADA');

    } catch (error) {
        console.error('❌ Error en prueba:', error.message);
        process.exit(1);
    }
}

test();
