const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDetailedStandings(categoryId) {
  const teams = await prisma.team.findMany({ where: { categoryId } });
  const matches = await prisma.match.findMany({ where: { categoryId, status: 'played' } });

  const standings = teams.map(team => {
    const played = matches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);
    let wins = 0, diff = 0, pf = 0;
    played.forEach(m => {
      const isHome = m.homeTeamId === team.id;
      const ms = isHome ? m.homeScore : m.awayScore;
      const ts = isHome ? m.awayScore : m.homeScore;
      pf += ms; diff += (ms - ts);
      if (ms > ts) wins++;
    });
    return { teamId: team.id, group: team.group, wins, diff, pf };
  });

  return standings.sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf);
}

async function main() {
  const categoryId = 615;
  const results = await getDetailedStandings(categoryId);
  
  // Rank 1: results[0], Rank 4: results[3]
  // Rank 2: results[1], Rank 3: results[2]

  const rank1 = results[0].teamId;
  const rank2 = results[1].teamId;
  const rank3 = results[2].teamId;
  const rank4 = results[3].teamId;

  console.log(`Rankings for 615: 1:${rank1}, 2:${rank2}, 3:${rank3}, 4:${rank4}`);

  // Actualizar Semifinal 1 (ID 3227)
  await prisma.match.update({
    where: { id: 3227 },
    data: {
      homeTeamId: rank1,
      awayTeamId: rank4,
      status: 'pending',
      homeScore: null,
      awayScore: null,
      homeFouls: 0,
      awayFouls: 0
    }
  });

  // Semifinal 2 (ID 3228) - Ya tiene Rank 2 vs 3, pero nos aseguramos
  await prisma.match.update({
    where: { id: 3228 },
    data: {
      homeTeamId: rank2,
      awayTeamId: rank3,
      status: 'pending'
    }
  });

  console.log("Fix applied to Category 615.");
}

main().finally(() => prisma.$disconnect());
