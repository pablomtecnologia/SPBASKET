const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categoryId = 776; // BENJAMIN (I should verify this ID)
  
  // Actually, I have the category ID from the match ID 3195
  const m3195 = await prisma.match.findUnique({ where: { id: 3195 } });
  const catId = m3195.categoryId;

  const matches = await prisma.match.findMany({
    where: { categoryId: catId, round: 1 },
    orderBy: { matchNumber: 'asc' }
  });

  console.log("Group Stage Matches for Category", catId);
  matches.forEach(m => {
    console.log(`#${m.matchNumber}: Home ${m.homeTeamId} vs Away ${m.awayTeamId} - Score: ${m.homeScore}-${m.awayScore} Status: ${m.status}`);
  });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
