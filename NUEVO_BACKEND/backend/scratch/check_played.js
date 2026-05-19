const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const matches = await prisma.match.findMany({
    where: { status: 'played' },
    include: { homeTeam: true, awayTeam: true }
  });
  console.log('PLAYED MATCHES:', JSON.stringify(matches, null, 2));
}

check();
