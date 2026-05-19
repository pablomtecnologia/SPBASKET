const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const cats = await prisma.category.findMany();
  console.log('CATEGORIES:', JSON.stringify(cats, null, 2));
  const matches = await prisma.match.findMany({
    take: 10,
    include: { homeTeam: true, awayTeam: true }
  });
  console.log('MATCHES:', JSON.stringify(matches, null, 2));
}

check();
