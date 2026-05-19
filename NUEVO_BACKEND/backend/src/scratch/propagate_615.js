const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Re-implementing simplified refresh just to trigger the propagation
async function getWinner(groupName, matches) {
  const m = matches.find(m => m.group === groupName);
  if (!m || m.status !== 'played') return null;
  return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
}

async function main() {
  const categoryId = 615;
  const matches = await prisma.match.findMany({ where: { categoryId } });
  
  const w1 = await getWinner('Semifinal 1', matches);
  const w2 = await getWinner('Semifinal 2', matches);

  console.log(`Winners: Semi1:${w1}, Semi2:${w2}`);

  // Propagar a la Final
  const finalMatch = matches.find(m => m.group === 'Final');
  if (finalMatch) {
    await prisma.match.update({
      where: { id: finalMatch.id },
      data: {
        homeTeamId: w1,
        awayTeamId: w2
      }
    });
  }
  console.log("Propagation done.");
}

main().finally(() => prisma.$disconnect());
