// test-fecan-full.js - Prueba del scraper completo
const { scrapeAll } = require('./fecan-scraper-full');

async function test() {
    console.log('🧪 Probando scraper completo de FECAN...\n');

    try {
        // Probar SP ROSA
        console.log('📍 Testeando SP ROSA...');
        const rosaData = await scrapeAll('sp-rosa');
        console.log('\n📄 DATOS SP ROSA:');
        console.log(JSON.stringify(rosaData, null, 2));

        console.log('\n' + '═'.repeat(80) + '\n');

        // Probar SP NEGRO
        console.log('📍 Testeando SP NEGRO...');
        const negroData = await scrapeAll('sp-negro');
        console.log('\n📄 DATOS SP NEGRO:');
        console.log(JSON.stringify(negroData, null, 2));

        console.log('\n✅ PRUEBA COMPLETADA');

    } catch (error) {
        console.error('❌ Error en prueba:', error);
        process.exit(1);
    }
}

test();
