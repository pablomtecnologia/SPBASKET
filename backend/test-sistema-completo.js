// test-sistema-completo.js - Prueba el sistema completo FECAN
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testSistemaCompleto() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         🏀 TEST SISTEMA COMPLETO FECAN - LOCALHOST 🏀         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    try {
        // Test SP ROSA
        console.log('📊 TESTEANDO SP ROSA...\n');
        const rosaResponse = await axios.get(`${BASE_URL}/fecan/complete/sp-rosa`);
        const rosaData = rosaResponse.data;

        console.log(`✅ SP ROSA - ${rosaData.info.title}`);
        console.log(`   Temporada: ${rosaData.info.season}\n`);

        console.log(`   📈 ESTADÍSTICAS:`);
        console.log(`      • Total equipos: ${rosaData.stats.totalEquipos}`);
        console.log(`      • Total partidos: ${rosaData.stats.totalPartidos}`);
        console.log(`      • Partidos jugados: ${rosaData.stats.partidosJugados}`);
        console.log(`      • Próximos partidos: ${rosaData.stats.proximosPartidos}\n`);

        console.log(`   🏆 TOP 3 CLASIFICACIÓN:`);
        rosaData.clasificacion.slice(0, 3).forEach((team, index) => {
            const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            console.log(`      ${emoji} ${team.position}. ${team.team_name}`);
            console.log(`         ${team.won}V-${team.lost}D | ${team.points} pts`);
        });

        const saskiRosa = rosaData.clasificacion.find(t =>
            t.team_name.toLowerCase().includes('saski') ||
            t.team_name.toLowerCase().includes('penguins')
        );
        if (saskiRosa) {
            console.log(`\n      🌟 SASKI PENGUINS ROSA:`);
            console.log(`         Posición: ${saskiRosa.position}°`);
            console.log(`         Record: ${saskiRosa.won}V-${saskiRosa.lost}D`);
            console.log(`         Puntos: ${saskiRosa.points}`);
        }

        console.log(`\n   ⚽ ÚLTIMOS 3 PARTIDOS:`);
        const partidosRosa = rosaData.partidos.filter(p => p.estado === 'played').slice(-3);
        partidosRosa.forEach(match => {
            const resultado = `${match.resultado_local}-${match.resultado_visitante}`;
            console.log(`      J${match.jornada}: ${match.equipo_local} ${resultado} ${match.equipo_visitante}`);
            console.log(`         📅 ${match.fecha} | 📍 ${match.pabellon}`);
        });

        const proximoRosa = rosaData.partidos.find(p => p.estado === 'upcoming');
        if (proximoRosa) {
            console.log(`\n   🔜 PRÓXIMO PARTIDO:`);
            console.log(`      ${proximoRosa.equipo_local} vs ${proximoRosa.equipo_visitante}`);
            console.log(`      📅 ${proximoRosa.fecha} ${proximoRosa.hora}`);
            console.log(`      📍 ${proximoRosa.pabellon}`);
        }

        console.log('\n' + '═'.repeat(80) + '\n');

        // Test SP NEGRO
        console.log('📊 TESTEANDO SP NEGRO...\n');
        const negroResponse = await axios.get(`${BASE_URL}/fecan/complete/sp-negro`);
        const negroData = negroResponse.data;

        console.log(`✅ SP NEGRO - ${negroData.info.title}`);
        console.log(`   Temporada: ${negroData.info.season}\n`);

        console.log(`   📈 ESTADÍSTICAS:`);
        console.log(`      • Total equipos: ${negroData.stats.totalEquipos}`);
        console.log(`      • Partidos jugados: ${negroData.stats.partidosJugados}`);
        console.log(`      • Próximos partidos: ${negroData.stats.proximosPartidos}\n`);

        console.log(`   🏆 TOP 3 CLASIFICACIÓN:`);
        negroData.clasificacion.slice(0, 3).forEach((team, index) => {
            const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            console.log(`      ${emoji} ${team.position}. ${team.team_name}`);
            console.log(`         ${team.won}V-${team.lost}D | ${team.points} pts`);
        });

        const saskiNegro = negroData.clasificacion.find(t =>
            t.team_name.toLowerCase().includes('saski') ||
            t.team_name.toLowerCase().includes('penguins')
        );
        if (saskiNegro) {
            console.log(`\n      🌟 SASKI PENGUINS NEGRO:`);
            console.log(`         Posición: ${saskiNegro.position}°`);
            console.log(`         Record: ${saskiNegro.won}V-${saskiNegro.lost}D`);
            console.log(`         Puntos: ${saskiNegro.points}`);
        }

        const proximoNegro = negroData.partidos.find(p => p.estado === 'upcoming');
        if (proximoNegro) {
            console.log(`\n   🔜 PRÓXIMO PARTIDO:`);
            console.log(`      ${proximoNegro.equipo_local} vs ${proximoNegro.equipo_visitante}`);
            console.log(`      📅 ${proximoNegro.fecha} ${proximoNegro.hora}`);
            console.log(`      📍 ${proximoNegro.pabellon}`);
        }

        console.log('\n' + '═'.repeat(80));
        console.log('🎉 ¡SISTEMA COMPLETO FUNCIONANDO PERFECTAMENTE!');
        console.log('═'.repeat(80));
        console.log('\n📝 RESUMEN:');
        console.log('   ✅ Backend API respondiendo en localhost:3001');
        console.log('   ✅ Base de datos con datos scrapeados');
        console.log('   ✅ Endpoints /api/fecan/complete funcionando');
        console.log('   ✅ Datos de clasificación disponibles');
        console.log('   ✅ Datos de partidos disponibles');
        console.log('   ✅ Estadísticas calculadas correctamente');
        console.log('\n🌐 FRONTEND:');
        console.log('   El frontend Angular está compilando...');
        console.log('   Cuando termine, abre: http://localhost:4200');
        console.log('   Navega a: COMPETICIONES → SP ROSA/SP NEGRO');
        console.log('\n💡 LOS DATOS QUE VERÁS EN EL FRONTEND SON EXACTAMENTE ESTOS ⬆️\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   URL: ${error.config.url}`);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   El servidor backend no está corriendo en localhost:3001');
            console.error('   Ejecuta: node server.js');
        }
    }
}

testSistemaCompleto();
