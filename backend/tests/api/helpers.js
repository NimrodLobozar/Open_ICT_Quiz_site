import request from 'supertest'
import app from '../../app.js'
import { hashPassword } from '../../auth/password.js'
import { prisma } from '../../db/prisma.js'
import { nameKey } from '../../game/nameRules.js'
import { outbox } from '../../mail/sendMail.js'

export { app, outbox, prisma }

// De REST-routes sturen ook live-berichten (bijv. lobby:update na het joinen) via app.get('io').
// In de tests draait er geen Socket.IO-server; deze nep-io slikt alles in.
const silent = { emit() {}, to: () => silent, in: () => silent, disconnectSockets() {} }
app.set('io', silent)

/** Leegt alle tabellen (en de nep-inbox). In beforeEach, zodat elke test schoon begint. */
export async function resetDatabase() {
  outbox.length = 0
  await prisma.$executeRawUnsafe(
    'TRUNCATE "User", "Session", "OneTimeToken", "Quiz", "Question", "AnswerOption", "GameSession", "GameResult" RESTART IDENTITY CASCADE',
  )
}

/** Een "browser": onthoudt cookies tussen requests, net als een echte browser. */
export function browser() {
  return request.agent(app)
}

export const PASSWORD = 'Geheim123'

let counter = 0
/**
 * Maakt direct in de database een account (sneller dan via /register, en voor docenten/beheerders de enige manier).
 * Standaard met een bevestigd e-mailadres, zodat je meteen kunt inloggen; verified: false voor een onbevestigd account.
 */
export async function makeUser({ role = 'STUDENT', username, email, password = PASSWORD, verified = true } = {}) {
  counter += 1
  const name = username ?? `Gebruiker${counter}`
  return prisma.user.create({
    data: {
      username: name,
      usernameKey: nameKey(name),
      email: email ?? `gebruiker${counter}@test.nl`,
      passwordHash: password === null ? null : await hashPassword(password),
      role,
      emailVerifiedAt: verified ? new Date() : null,
    },
  })
}

/**
 * De laatste link uit de nep-inbox voor dit adres (tests versturen geen echte mail; zie sendMail.js).
 * @returns {string | null} de token uit de link
 */
export async function tokenFromMail(email, path) {
  // De bevestigingsmail na registreren wordt verstuurd zonder erop te wachten; even de beurt geven.
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const mail = outbox.findLast((item) => item.to === email && item.text.includes(path))
    if (mail) return new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get('token')
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  return null
}

/** Een ingelogde browser voor een nieuw account. */
export async function loggedIn(options = {}) {
  const user = await makeUser(options)
  const agent = browser()
  const response = await agent.post('/api/auth/login').send({ email: user.email, password: options.password ?? PASSWORD })
  if (response.status !== 200) throw new Error(`Inloggen mislukt: ${response.status} ${JSON.stringify(response.body)}`)
  return { user, agent }
}

/** Een quiz met één (of meer) geldige vragen. */
export function quizInput(overrides = {}) {
  return {
    title: 'Testquiz',
    status: 'READY',
    questions: [
      {
        text: 'Hoeveel bits zitten er in een byte?',
        timeLimitSec: 20,
        options: [
          { text: '4', isCorrect: false },
          { text: '8', isCorrect: true },
        ],
      },
    ],
    ...overrides,
  }
}
