const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matchId = 3195;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      category: {
        include: {
          _count: { select: { teams: true } }
        }
      },
      homeTeam: true,
      awayTeam: true
    }
  });

  if (!match) {
    console.log("Match 34 not found");
    return;
  }

  console.log("Match:", match.id, match.group, match.matchNumber);
  console.log("Category:", match.category.name, "Teams:", match.category._count.teams);
  console.log("Home Team:", match.homeTeam?.name, "(ID:", match.homeTeamId, ")");
  console.log("Away Team:", match.awayTeam?.name, "(ID:", match.awayTeamId, ")");

  // Check the semifinal matches if it's a final
  if (match.group === 'Final') {
    const semis = await prisma.match.findMany({
      where: {
        categoryId: match.categoryId,
        group: { startsWith: 'Semifinal' }
      }
    });
    semis.forEach(s => {
      console.log("Semi:", s.group, "Winner expected from logic:", s.homeScore > s.awayScore ? s.homeTeamId : s.awayTeamId, "(Score:", s.homeScore, "-", s.awayScore, ")");
    });
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
