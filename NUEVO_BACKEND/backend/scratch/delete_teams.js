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

  console.log(`Deleting teams and players for tournament: ${tournament.name} (${tournament.id})`)

  // Categories belong to tournament
  const categories = await prisma.category.findMany({
    where: { tournamentId: tournament.id }
  })

  const categoryIds = categories.map(c => c.id)

  // Delete players (via teams via categories)
  const teams = await prisma.team.findMany({
    where: { categoryId: { in: categoryIds } }
  })
  const teamIds = teams.map(t => t.id)

  const deletedPlayers = await prisma.player.deleteMany({
    where: { teamId: { in: teamIds } }
  })
  console.log(`Deleted ${deletedPlayers.count} players`)

  const deletedTeams = await prisma.team.deleteMany({
    where: { categoryId: { in: categoryIds } }
  })
  console.log(`Deleted ${deletedTeams.count} teams`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
