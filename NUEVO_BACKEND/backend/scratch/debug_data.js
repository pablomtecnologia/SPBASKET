const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const categories = await prisma.category.findMany({
      include: { teams: { include: { players: true } } }
    });
    console.log(JSON.stringify(categories, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
