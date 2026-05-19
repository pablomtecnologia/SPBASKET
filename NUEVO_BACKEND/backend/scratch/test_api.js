const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        categories: true,
        jornadas: true,
        courts: true,
        _count: { select: { scheduleSlots: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = await Promise.all(tournaments.map(async (t) => {
      const [total, pending] = await Promise.all([
        prisma.match.count({ where: { category: { tournamentId: t.id } } }),
        prisma.match.count({ where: { category: { tournamentId: t.id }, status: 'pending' } })
      ]);
      return { 
        ...t, 
        totalMatches: total, 
        pendingMatches: pending 
      };
    }));

    console.log('RESULTADO:', JSON.stringify(enriched, null, 2));
  } catch (e) {
    console.error('ERROR_PRISMA:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
