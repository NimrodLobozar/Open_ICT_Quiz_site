import { hashPassword } from '../auth/password.js'
import { nameKey } from '../game/nameRules.js'
import { QUIZ_QUESTIONS } from '../game/quizQuestions.js'
import { prisma } from './prisma.js'

/**
 * Startdata, één keer bij het opstarten van de server (backend/index.js). Doet niets als het er al is.
 * 1. De eerste beheerder, uit de omgevingsvariabelen SEED_ADMIN_EMAIL en SEED_ADMIN_PASSWORD.
 *    Zonder beheerder kan niemand docenten aanmaken, en een beheerder kan zich niet registreren (story 11).
 *    Samen met de beheerder komen er drie testaccounts bij (alleen buiten productie), zie DUMMY_USERS.
 * 2. De voorbeeldquiz met de vragen die eerst vast in quizQuestions.js stonden (story 7).
 */
export async function seedDatabase() {
  const admin = await seedAdmin()
  if (admin && process.env.SEED_ADMIN_EMAIL) await seedDummyUsers()
  // Story 14: docenten van vóór de e-mailbevestiging. Hun wachtwoord kwam altijd via de uitnodigingsmail,
  // dus hun adres is al bewezen. Zonder dit konden ze na de update niet meer inloggen. Doet niets als alles klopt.
  const { count } = await prisma.user.updateMany({
    where: { role: 'TEACHER', emailVerifiedAt: null, passwordHash: { not: null } },
    data: { emailVerifiedAt: new Date() },
  })
  if (count) console.log(`Seed: ${count} bestaande docent(en) als bevestigd gemarkeerd.`)
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

// Testaccounts voor development, zodat je meteen als student of docent kunt inloggen zonder te registreren.
// Al bevestigd (emailVerifiedAt), dus er is geen bevestigingsmail nodig.
const DUMMY_USERS = [
  { username: 'Emma', email: 'emma@student.hu.nl', password: 'Student123', role: 'STUDENT' },
  { username: 'Daan', email: 'daan@student.hu.nl', password: 'Student123', role: 'STUDENT' },
  { username: 'Docent', email: 'docent@hu.nl', password: 'Docent123', role: 'TEACHER' },
]

async function seedDummyUsers() {
  // Nooit op een echte server: iedereen kent deze wachtwoorden (ze staan in de code).
  if (process.env.NODE_ENV === 'production') return
  for (const user of DUMMY_USERS) {
    // Bestaat het e-mailadres of de naam al, dan laten we het account met rust.
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: user.email }, { usernameKey: nameKey(user.username) }] },
    })
    if (existing) continue
    await prisma.user.create({
      data: {
        username: user.username,
        usernameKey: nameKey(user.username),
        email: user.email,
        passwordHash: await hashPassword(user.password),
        role: user.role,
        emailVerifiedAt: new Date(),
      },
    })
    console.log(`Seed: testaccount ${user.email} aangemaakt.`)
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) return prisma.user.findFirst({ where: { role: 'ADMIN' } })

  const existing = await prisma.user.findUnique({ where: { email } })
  // De seed-beheerder valt buiten de HU-regel en heeft geen bevestigingsmail nodig (story 14).
  // Ook een beheerder van vóór story 14 (kolom emailVerifiedAt nog leeg) moet kunnen blijven inloggen.
  if (existing && !existing.emailVerifiedAt) {
    return prisma.user.update({ where: { id: existing.id }, data: { emailVerifiedAt: new Date() } })
  }
  if (existing) return existing

  const username = process.env.SEED_ADMIN_NAME?.trim() || 'Beheerder'
  const admin = await prisma.user.create({
    data: {
      username,
      usernameKey: nameKey(username),
      email,
      passwordHash: await hashPassword(password),
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  })
  console.log(`Seed: beheerder ${email} aangemaakt.`)
  return admin
}
