const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.tournament.findFirst();
  if (!tournament) {
    console.log('No hay torneos para asignar oficiales.');
    return;
  }
  
  const result = await prisma.official.updateMany({
    where: { tournamentId: null },
    data: { tournamentId: tournament.id }
  });
  
  console.log(`Asignados ${result.count} oficiales al torneo: ${tournament.name} (ID: ${tournament.id})`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
