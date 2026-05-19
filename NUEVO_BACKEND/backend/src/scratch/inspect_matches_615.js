const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const catId = 615;
  const matches = await prisma.match.findMany({
    where: { categoryId: catId, round: { gte: 2 } },
    include: { homeTeam: true, awayTeam: true }
  });

  console.log("Matches for Category 615 (Final Phase):");
  matches.forEach(m => {
    console.log(`ID: ${m.id} | Group: ${m.group} | Home: ${m.homeTeam?.name} (${m.homeTeamId}) | Away: ${m.awayTeam?.name} (${m.awayTeamId}) | Status: ${m.status}`);
  });
}

main().finally(() => prisma.$disconnect());
