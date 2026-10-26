import { hashPassword } from '../auth/password.js'
import { nameKey } from '../game/nameRules.js'
import { QUIZ_QUESTIONS } from '../game/quizQuestions.js'
import { prisma } from './prisma.js'

/**
 * Startdata, één keer bij het opstarten van de server (backend/index.js). Doet niets als het er al is.
 * 1. De eerste beheerder, uit de omgevingsvariabelen SEED_ADMIN_EMAIL en SEED_ADMIN_PASSWORD.
 *    Zonder beheerder kan niemand docenten aanmaken, en een beheerder kan zich niet registreren (story 11).
 * 2. De voorbeeldquiz met de vragen die eerst vast in quizQuestions.js stonden (story 7).
 */
export async function seedDatabase() {
  const admin = await seedAdmin()
  if ((await prisma.quiz.count()) === 0) {
    await prisma.quiz.create({
      data: {
        title: 'Open ICT Quiz · voorbeeld',
        status: 'READY',
        ownerId: admin?.id ?? null,
        questions: {
          create: QUIZ_QUESTIONS.map((question, index) => ({
            text: question.text,
            order: index,
            timeLimitSec: question.timeLimitSec,
            options: {
              create: question.options.map((option, optionIndex) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                order: optionIndex,
              })),
            },
          })),
        },
      },
    })
    console.log('Seed: voorbeeldquiz aangemaakt.')
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) return prisma.user.findFirst({ where: { role: 'ADMIN' } })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return existing

  const username = process.env.SEED_ADMIN_NAME?.trim() || 'Beheerder'
  const admin = await prisma.user.create({
    data: {
      username,
      usernameKey: nameKey(username),
      email,
      passwordHash: await hashPassword(password),
      role: 'ADMIN',
    },
  })
  console.log(`Seed: beheerder ${email} aangemaakt.`)
  return admin
}
