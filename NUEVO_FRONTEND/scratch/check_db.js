const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: { NOT: { officialName: null } }
  });
  console.log('Matches with officialName:', JSON.stringify(matches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
