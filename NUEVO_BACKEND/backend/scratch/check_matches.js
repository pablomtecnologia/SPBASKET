const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMatches() {
  const matches = await prisma.match.findMany({
    where: { categoryId: 1 }, // Assuming ID 1 is VETERANO FEMENINO based on screenshot
    include: { homeTeam: true, awayTeam: true }
  });
  console.log(JSON.stringify(matches, null, 2));
}

checkMatches();
