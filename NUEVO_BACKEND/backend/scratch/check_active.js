const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const activeTournament = await prisma.tournament.findFirst({
      where: { active: true }
    });
    console.log('Active Tournament:', JSON.stringify(activeTournament, null, 2));
    
    if (activeTournament) {
      const officials = await prisma.official.findMany({ where: { tournamentId: activeTournament.id } });
      const courts = await prisma.court.findMany({ where: { tournamentId: activeTournament.id } });
      console.log('Officials count:', officials.length);
      console.log('Courts count:', courts.length);
    } else {
      console.log('No active tournament found!');
      const all = await prisma.tournament.findMany();
      console.log('Total tournaments:', all.length);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
