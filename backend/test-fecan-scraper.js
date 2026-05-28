// test-fecan-scraper.js - Script de prueba para el scraper de FECAN
const { getFecanMatches, scrapeFecanAPI, scrapeFecanMatches } = require('./scraper-fecan');

async function testScraper() {
    console.log('🧪 Iniciando prueba del scraper de FECAN\n');

    const teamId = 4046; // ID del equipo SP Basket en FECAN

    try {
        console.log(`📋 Intentando obtener partidos del equipo ${teamId}...\n`);

        // Probar primero con API
        console.log('🔍 Método 1: Intentando API JSON...');
        const apiMatches = await scrapeFecanAPI(teamId);

        if (apiMatches && apiMatches.length > 0) {
            console.log(`✅ API JSON exitosa: ${apiMatches.length} partidos encontrados`);
            console.log('\n📊 Primeros 3 partidos de la API:');
            apiMatches.slice(0, 3).forEach((match, i) => {
                console.log(`\nPartido ${i + 1}:`);
                console.log(`  Jornada: ${match.round}`);
                console.log(`  Fecha: ${match.date}`);
                console.log(`  Hora: ${match.time}`);
                console.log(`  Partido: ${match.homeTeam} vs ${match.awayTeam}`);
                console.log(`  Ubicación: ${match.location}`);
                if (match.status === 'played') {
                    console.log(`  Resultado: ${match.homeScore} - ${match.awayScore}`);
                } else {
                    console.log(`  Estado: Por jugar`);
                }
            });
        } else {
            console.log('⚠️ La API JSON no devolvió resultados');

            // Probar con scraping HTML
            console.log('\n🔍 Método 2: Intentando scraping HTML...');
            const htmlMatches = await scrapeFecanMatches(teamId);

            if (htmlMatches && htmlMatches.length > 0) {
                console.log(`✅ Scraping HTML exitoso: ${htmlMatches.length} partidos encontrados`);
                console.log('\n📊 Primeros 3 partidos del HTML:');
                htmlMatches.slice(0, 3).forEach((match, i) => {
                    console.log(`\nPartido ${i + 1}:`);
                    console.log(`  Jornada: ${match.round}`);
                    console.log(`  Fecha: ${match.date}`);
                    console.log(`  Hora: ${match.time}`);
                    console.log(`  Partido: ${match.homeTeam} vs ${match.awayTeam}`);
                    console.log(`  Ubicación: ${match.location}`);
                    if (match.status === 'played') {
                        console.log(`  Resultado: ${match.homeScore} - ${match.awayScore}`);
                    } else {
                        console.log(`  Estado: Por jugar`);
                    }
                });
            } else {
                console.log('❌ El scraping HTML tampoco devolvió resultados');
            }
        }

        // Probar función principal
        console.log('\n\n🎯 Probando función principal getFecanMatches...');
        const matches = await getFecanMatches(teamId);
        console.log(`✅ Función principal: ${matches.length} partidos obtenidos`);

        // Estadísticas
        const played = matches.filter(m => m.status === 'played').length;
        const upcoming = matches.filter(m => m.status === 'upcoming').length;

        console.log('\n📈 Estadísticas:');
        console.log(`  Total de partidos: ${matches.length}`);
        console.log(`  Partidos jugados: ${played}`);
        console.log(`  Partidos por jugar: ${upcoming}`);

        // Verificar estructura de datos
        if (matches.length > 0) {
            console.log('\n🔍 Estructura del primer partido:');
            console.log(JSON.stringify(matches[0], null, 2));
        }

        console.log('\n✅ Prueba completada exitosamente!');

    } catch (error) {
        console.error('\n❌ Error durante la prueba:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Ejecutar prueba
console.log('='.repeat(60));
console.log('  PRUEBA DEL SCRAPER DE FECAN PARA SP BASKET');
console.log('='.repeat(60));
console.log('');

testScraper()
    .then(() => {
        console.log('\n' + '='.repeat(60));
        console.log('  FIN DE LA PRUEBA');
        console.log('='.repeat(60));
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });
