const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const tournamentName = "IV TORNEO SOLIDARIO 3x3 SPBASKET 2026"
  const tournament = await prisma.tournament.findFirst({
    where: { name: tournamentName }
  })

  if (!tournament) {
    console.log("Tournament not found")
    return
  }

  console.log(`🧹 Cleaning EVERYTHING for tournament: ${tournament.name} (${tournament.id})`)

  const categories = await prisma.category.findMany({
    where: { tournamentId: tournament.id }
  })
  const categoryIds = categories.map(c => c.id)

  // 1. Delete Schedule Slots
  const deletedSlots = await prisma.scheduleSlot.deleteMany({
    where: { tournamentId: tournament.id }
  })
  console.log(`✅ Deleted ${deletedSlots.count} schedule slots (Calendario)`)

  // 2. Delete Match Logs (must be before matches)
  const matches = await prisma.match.findMany({
    where: { categoryId: { in: categoryIds } }
  })
  const matchIds = matches.map(m => m.id)

  const deletedLogs = await prisma.matchLog.deleteMany({
    where: { matchId: { in: matchIds } }
  })
  console.log(`✅ Deleted ${deletedLogs.count} match logs`)

  // 3. Delete Matches
  const deletedMatches = await prisma.match.deleteMany({
    where: { categoryId: { in: categoryIds } }
  })
  console.log(`✅ Deleted ${deletedMatches.count} matches (Partidos)`)

  // 4. Delete Players
  const teams = await prisma.team.findMany({
    where: { categoryId: { in: categoryIds } }
  })
  const teamIds = teams.map(t => t.id)

  const deletedPlayers = await prisma.player.deleteMany({
    where: { teamId: { in: teamIds } }
  })
  console.log(`✅ Deleted ${deletedPlayers.count} players`)

  // 5. Delete Teams
  const deletedTeams = await prisma.team.deleteMany({
    where: { categoryId: { in: categoryIds } }
  })
  console.log(`✅ Deleted ${deletedTeams.count} teams`)

  console.log("✨ Tournament cleaned successfully (Categories remain)")
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
