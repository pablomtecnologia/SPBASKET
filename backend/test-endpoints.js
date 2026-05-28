// test-endpoints.js - Prueba los endpoints de FECAN
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
    console.log('🧪 Probando endpoints de FECAN en localhost...\n');

    try {
        // 1. Probar clasificación SP ROSA
        console.log('📊 GET /api/fecan/clasificacion/sp-rosa');
        console.log('─'.repeat(80));
        const clasificacionRosa = await axios.get(`${BASE_URL}/api/fecan/clasificacion/sp-rosa`);
        console.log(`✅ Clasificación SP ROSA (${clasificacionRosa.data.length} equipos):\n`);
        clasificacionRosa.data.slice(0, 3).forEach(team => {
            console.log(`   ${team.position}. ${team.team_name}`);
            console.log(`      PJ: ${team.played} | G: ${team.won} | P: ${team.lost} | PTS: ${team.points}`);
        });

        console.log('\n' + '═'.repeat(80) + '\n');

        // 2. Probar partidos SP ROSA
        console.log('⚽ GET /api/fecan/partidos/sp-rosa');
        console.log('─'.repeat(80));
        const partidosRosa = await axios.get(`${BASE_URL}/api/fecan/partidos/sp-rosa`);
        console.log(`✅ Partidos SP ROSA (${partidosRosa.data.length} partidos):\n`);
        partidosRosa.data.slice(0, 5).forEach(match => {
            const resultado = match.estado === 'played' ?
                `${match.resultado_local}-${match.resultado_visitante}` :
                'vs';
            console.log(`   J${match.jornada}: ${match.equipo_local} ${resultado} ${match.equipo_visitante}`);
            console.log(`      📍 ${match.pabellon} | 📅 ${match.fecha} ${match.hora}`);
        });

        console.log('\n' + '═'.repeat(80) + '\n');

        // 3. Probar endpoint completo
        console.log('🎯 GET /api/fecan/complete/sp-rosa');
        console.log('─'.repeat(80));
        const completeRosa = await axios.get(`${BASE_URL}/api/fecan/complete/sp-rosa`);
        console.log('✅ Datos completos SP ROSA:\n');
        console.log(`   📊 Competición: ${completeRosa.data.info.title}`);
        console.log(`   🗓️  Temporada: ${completeRosa.data.info.season}`);
        console.log(`\n   📈 Estadísticas:`);
        console.log(`      - Total equipos: ${completeRosa.data.stats.totalEquipos}`);
        console.log(`      - Total partidos: ${completeRosa.data.stats.totalPartidos}`);
        console.log(`      - Partidos jugados: ${completeRosa.data.stats.partidosJugados}`);
        console.log(`      - Próximos partidos: ${completeRosa.data.stats.proximosPartidos}`);

        console.log('\n' + '═'.repeat(80) + '\n');

        // 4. Lo mismo para SP NEGRO
        console.log('📊 GET /api/fecan/complete/sp-negro');
        console.log('─'.repeat(80));
        const completeNegro = await axios.get(`${BASE_URL}/api/fecan/complete/sp-negro`);
        console.log('✅ Datos completos SP NEGRO:\n');
        console.log(`   📊 Competición: ${completeNegro.data.info.title}`);
        console.log(`   🏆 Top 3 clasificación:`);
        completeNegro.data.clasificacion.slice(0, 3).forEach(team => {
            console.log(`      ${team.position}. ${team.team_name} (${team.points} pts)`);
        });
        console.log(`\n   📈 Estadísticas:`);
        console.log(`      - Total equipos: ${completeNegro.data.stats.totalEquipos}`);
        console.log(`      - Partidos jugados: ${completeNegro.data.stats.partidosJugados}`);
        console.log(`      - Próximos partidos: ${completeNegro.data.stats.proximosPartidos}`);

        console.log('\n' + '═'.repeat(80));
        console.log('🎉 ¡TODOS LOS ENDPOINTS FUNCIONAN CORRECTAMENTE!');
        console.log('═'.repeat(80));
        console.log('\n📝 ENDPOINTS DISPONIBLES:');
        console.log('   • GET /api/fecan/clasificacion/:teamId');
        console.log('   • GET /api/fecan/partidos/:teamId');
        console.log('   • GET /api/fecan/info/:teamId');
        console.log('   • GET /api/fecan/complete/:teamId  (TODO en uno)');
        console.log('\n💡 Ahora puedes usarlos en tu frontend Angular!\n');

    } catch (error) {
        console.error('❌ Error probando endpoints:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }
    }
}

testEndpoints();
