import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

const lobbies = [
  {
    code: '123456',
    title: 'ICT Basisquiz',
    players: ['Sanne', 'Daan', 'Fatima'],
  },
  {
    code: '654321',
    title: 'Webontwikkeling',
    players: ['Lucas', 'Noah', 'Yara'],
  },
]

try {
  for (const lobby of lobbies) {
    const quiz = await prisma.quiz.upsert({
      where: { code: lobby.code },
      update: { title: lobby.title, locked: false, isActive: true },
      create: { code: lobby.code, title: lobby.title },
    })

    await prisma.player.deleteMany({ where: { quizId: quiz.id } })
    await prisma.player.createMany({
      data: lobby.players.map((nickname) => ({ nickname, quizId: quiz.id })),
    })
  }

  console.log('Seed voltooid: 2 lobbies met spelers aangemaakt.')
} finally {
  await prisma.$disconnect()
}
