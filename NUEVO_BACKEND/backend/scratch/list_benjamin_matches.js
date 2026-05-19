const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categoryId = 616; // BENJAMIN
  const matches = await prisma.match.findMany({
    where: { categoryId },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: 'asc' }
  });

  console.log("Matches for Category", categoryId);
  matches.forEach(m => {
    console.log(`#${m.matchNumber} (${m.group}): ${m.homeTeam?.name || 'TBD'} vs ${m.awayTeam?.name || 'TBD'} - Score: ${m.homeScore}-${m.awayScore} Status: ${m.status}`);
  });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
