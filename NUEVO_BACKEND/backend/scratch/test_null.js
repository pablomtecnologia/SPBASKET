const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const matches = await prisma.match.findMany({
    where: { status: 'played' },
    take: 5
  });
  console.log('Played matches:', JSON.stringify(matches, null, 2));
  
  if (matches.length > 0) {
    const m = matches[0];
    console.log(`Testing reset for match ID: ${m.id}`);
    const updated = await prisma.match.update({
      where: { id: m.id },
      data: { homeScore: null, awayScore: null, status: 'pending' }
    });
    console.log('Updated match:', JSON.stringify(updated, null, 2));
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
