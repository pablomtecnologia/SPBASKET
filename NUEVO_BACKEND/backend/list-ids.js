const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ts = await prisma.tournament.findMany({ select: { id: true, name: true } });
  console.log(JSON.stringify(ts));
}
main().catch(console.error).finally(() => prisma.$disconnect());
