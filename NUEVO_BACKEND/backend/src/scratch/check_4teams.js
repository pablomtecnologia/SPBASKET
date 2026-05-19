const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      teams: true,
      matches: {
        include: {
          homeTeam: true,
          awayTeam: true
        }
      }
    }
  });

  for (const cat of categories) {
    if (cat.teams.length === 4) {
      console.log(`\nCategory: ${cat.name} (ID: ${cat.id})`);
      console.log(`Teams: ${cat.teams.length}`);
      const leagueMatches = cat.matches.filter(m => m.round === 1);
      const played = leagueMatches.filter(m => m.status === 'played');
      const pending = leagueMatches.filter(m => m.status === 'pending');
      console.log(`League Matches: ${leagueMatches.length} (${played.length} played, ${pending.length} pending)`);
      
      if (pending.length === 0) {
        console.log("Group stage FINISHED.");
      } else {
        console.log("Group stage NOT finished.");
        pending.forEach(m => {
          console.log(`  - Pending: ${m.homeTeam?.name || '???'} vs ${m.awayTeam?.name || '???'}`);
        });
      }

      const finals = cat.matches.filter(m => m.round >= 2);
      console.log("Final Phase Matches:");
      finals.forEach(m => {
        console.log(`  - ${m.group}: ${m.homeTeam?.name || '???'} vs ${m.awayTeam?.name || '???'} (Status: ${m.status})`);
      });
    }
  }
}

main().finally(() => prisma.$disconnect());
