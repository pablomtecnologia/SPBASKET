const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: { matchNumber: 34 },
    include: {
      category: true,
      homeTeam: true,
      awayTeam: true
    }
  });

  console.log("Matches with number 34:");
  matches.forEach(m => {
    console.log(`ID: ${m.id} | Cat: ${m.category.name} | Group: ${m.group} | ${m.homeTeam?.name} vs ${m.awayTeam?.name}`);
  });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
