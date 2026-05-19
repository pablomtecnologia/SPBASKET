const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: { categoryId: 615, round: 1 },
    include: { homeTeam: true, awayTeam: true }
  });
  
  const teams = await prisma.team.findMany({ where: { categoryId: 615 } });
  
  console.log("League Matches for 615:");
  matches.forEach(m => {
    console.log(`${m.homeTeam.name} (${m.homeTeamId}) vs ${m.awayTeam.name} (${m.awayTeamId}): ${m.homeScore}-${m.awayScore} (${m.status})`);
  });

  const standings = teams.map(team => {
    const played = matches.filter(m => m.status === 'played' && (m.homeTeamId === team.id || m.awayTeamId === team.id));
    let wins = 0, diff = 0, pf = 0;
    played.forEach(m => {
      const isHome = m.homeTeamId === team.id;
      const ms = isHome ? m.homeScore : m.awayScore;
      const ts = isHome ? m.awayScore : m.homeScore;
      pf += ms; diff += (ms - ts);
      if (ms > ts) wins++;
    });
    return { name: team.name, id: team.id, wins, diff, pf };
  });

  standings.sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf);
  console.log("\nStandings (League Only):");
  standings.forEach((s, i) => {
    console.log(`${i+1}. ${s.name} - W:${s.wins} D:${s.diff} PF:${s.pf}`);
  });
}

main().finally(() => prisma.$disconnect());
