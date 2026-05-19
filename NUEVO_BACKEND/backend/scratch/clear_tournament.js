const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTournamentData() {
  const targetName = 'IV TORNEO SOLIDARIO 3x3 SPBASKET 2026';
  console.log(`🧹 Iniciando limpieza para: ${targetName}`);

  const tournament = await prisma.tournament.findFirst({
    where: { name: targetName }
  });

  if (!tournament) {
    console.log('❌ Torneo no encontrado.');
    return;
  }

  const tid = tournament.id;
  console.log(`✅ ID encontrado: ${tid}. Borrando datos en cascada...`);

  try {
    const result = await prisma.$transaction([
      // 1. Slots de calendario
      prisma.scheduleSlot.deleteMany({ where: { tournamentId: tid } }),
      // 2. Partidos
      prisma.match.deleteMany({ where: { category: { tournamentId: tid } } }),
      // 3. Jugadores
      prisma.player.deleteMany({ where: { team: { category: { tournamentId: tid } } } }),
      // 4. Equipos
      prisma.team.deleteMany({ where: { category: { tournamentId: tid } } }),
      // 5. Categorías
      prisma.category.deleteMany({ where: { tournamentId: tid } }),
    ]);

    console.log('✨ Limpieza completada exitosamente:');
    console.log(`   - Slots borrados: ${result[0].count}`);
    console.log(`   - Partidos borrados: ${result[1].count}`);
    console.log(`   - Jugadores borrados: ${result[2].count}`);
    console.log(`   - Equipos borrados: ${result[3].count}`);
    console.log(`   - Categorías borradas: ${result[4].count}`);
    console.log('ℹ️ Se ha mantenido la info general, jornadas y pistas del torneo.');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

clearTournamentData().finally(() => prisma.$disconnect());
