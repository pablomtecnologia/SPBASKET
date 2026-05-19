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
    return { teamId: team.id, name: team.name, group: team.group, wins, diff, pf };
  });

  return standings.sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf);
}

async function main() {
  const catId = 615;
  const cat = await prisma.category.findUnique({
    where: { id: catId },
    include: { teams: true, matches: { include: { homeTeam: true, awayTeam: true } } }
  });

  console.log(`\nCategory: ${cat.name} (ID: ${cat.id})`);
  const standings = await getDetailedStandings(catId);
  console.log("Standings:");
  standings.forEach((s, i) => {
    console.log(`${i+1}. ${s.name} (${s.teamId}) - W:${s.wins} D:${s.diff} PF:${s.pf}`);
  });

  const finals = cat.matches.filter(m => m.round >= 2);
  console.log("\nFinal Phase Matches:");
  finals.forEach(m => {
    console.log(`  - ${m.group}: ${m.homeTeam?.name || '???'} vs ${m.awayTeam?.name || '???'} (Status: ${m.status}) Score: ${m.homeScore}-${m.awayScore}`);
  });
}

main().finally(() => prisma.$disconnect());
