const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: { categoryId: 615 },
    orderBy: { id: 'asc' }
  });
  matches.forEach(m => {
    console.log(`${m.id}: ${m.group} | ${m.homeTeamId} vs ${m.awayTeamId} (${m.status})`);
  });
}

main().finally(() => prisma.$disconnect());
