const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const catId = 615;
  const logs = await prisma.matchLog.findMany({
    where: { match: { categoryId: catId } },
    orderBy: { timestamp: 'desc' },
    take: 10,
    include: { match: true }
  });

  console.log("Recent logs for Category 615:");
  logs.forEach(l => {
    console.log(`[${l.timestamp.toISOString()}] Match ID: ${l.matchId} | Action: ${l.action} | Match: ${l.match.group}`);
  });
}

main().finally(() => prisma.$disconnect());
