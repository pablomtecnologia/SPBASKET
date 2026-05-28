// test-api-direct.js - Prueba de la API directa
const { scrapeAll } = require('./fecan-api-direct');
const fs = require('fs');

async function test() {
    console.log('🧪 Probando API directa de FECAN...\n');

    try {
        // Probar SP ROSA
        const rosaData = await scrapeAll('sp-rosa');

        console.log('\n📄 SP ROSA - Primeros 3 equipos clasificación:');
        rosaData.clasificacion.slice(0, 3).forEach(team => {
            console.log(`   ${team.position}. ${team.team} - ${team.points} pts (${team.won}-${team.lost})`);
        });

        console.log('\n📄 SP ROSA - Primeros 5 partidos:');
        rosaData.partidos.slice(0, 5).forEach(match => {
            const resultado = match.estado === 'played' ?
                `${match.resultadoLocal}-${match.resultadoVisitante}` :
                'vs';
            console.log(`   J${match.jornada}: ${match.equipoLocal} ${resultado} ${match.equipoVisitante}`);
        });

        // Guardar datos completos de SP ROSA
        fs.writeFileSync('./sp-rosa-data.json', JSON.stringify(rosaData, null, 2));
        console.log('\n💾 Datos completos guardados en: sp-rosa-data.json');

        console.log('\n' + '═'.repeat(80) + '\n');

        // Probar SP NEGRO
        const negroData = await scrapeAll('sp-negro');

        console.log('\n📄 SP NEGRO - Primeros 3 equipos clasificación:');
        negroData.clasificacion.slice(0, 3).forEach(team => {
            console.log(`   ${team.position}. ${team.team} - ${team.points} pts (${team.won}-${team.lost})`);
        });

        console.log('\n📄 SP NEGRO - Primeros 5 partidos:');
        negroData.partidos.slice(0, 5).forEach(match => {
            const resultado = match.estado === 'played' ?
                `${match.resultadoLocal}-${match.resultadoVisitante}` :
                'vs';
            console.log(`   J${match.jornada}: ${match.equipoLocal} ${resultado} ${match.equipoVisitante}`);
        });

        // Guardar datos completos de SP NEGRO
        fs.writeFileSync('./sp-negro-data.json', JSON.stringify(negroData, null, 2));
        console.log('\n💾 Datos completos guardados en: sp-negro-data.json');

        console.log('\n✅ PRUEBA COMPLETADA - Los datos están listos para importar a la BD!');

    } catch (error) {
        console.error('❌ Error en prueba:', error.message);
        process.exit(1);
    }
}

test();
