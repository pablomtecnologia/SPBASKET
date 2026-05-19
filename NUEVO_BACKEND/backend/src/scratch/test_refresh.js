const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Re-implementing the exact logic from backend/src/index.js
async function getDetailedStandings(categoryId) {
  const teams = await prisma.team.findMany({ where: { categoryId } });
  const matches = await prisma.match.findMany({ where: { categoryId, round: 1, status: 'played' } });

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

async function refreshCategoryBrackets(categoryId) {
  const teams = await prisma.team.findMany({ where: { categoryId } });
  const matches = await prisma.match.findMany({ where: { categoryId } });
  const n = teams.length;

  const isGroupFinished = (groupName) => {
    if (!groupName) return false;
    // Round 1 is league
    return !matches.some(m => m.round === 1 && m.group === groupName && m.status === 'pending');
  };

  const results = await getDetailedStandings(categoryId);
  console.log("Results in refresh:", JSON.stringify(results, null, 2));

  const getTeamByRank = (groupName, rank) => {
    if (!isGroupFinished(groupName)) return null;
    const gResults = results.filter(r => r.group === groupName);
    gResults.sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf);
    return gResults[rank - 1]?.teamId || null;
  };

  const getWinner = (groupName) => {
    const m = matches.find(m => m.group === groupName);
    if (!m || m.status !== 'played') return null;
    return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
  };

  const updates = [];
  if (n === 4) {
    updates.push({ group: 'Semifinal 1', h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo A', 4) });
    updates.push({ group: 'Semifinal 2', h: getTeamByRank('Grupo A', 2), a: getTeamByRank('Grupo A', 3) });
    updates.push({ group: 'Final', h: getWinner('Semifinal 1'), a: getWinner('Semifinal 2') });
  }

  console.log("Calculated updates:", JSON.stringify(updates, null, 2));

  for (const upd of updates) {
    const match = matches.find(m => m.group === upd.group);
    if (match) {
      if (match.status === 'played') {
          console.log(`Skipping ${upd.group} (played)`);
          continue;
      }
      console.log(`Updating ${upd.group} to Home:${upd.h}, Away:${upd.a}`);
      await prisma.match.update({
        where: { id: match.id },
        data: { homeTeamId: upd.h, awayTeamId: upd.a }
      });
    }
  }
}

async function main() {
  await refreshCategoryBrackets(615);
}

main().finally(() => prisma.$disconnect());
