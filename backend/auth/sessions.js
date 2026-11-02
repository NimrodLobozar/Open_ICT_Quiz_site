import { prisma } from '../db/prisma.js'
import { deviceLabel } from './deviceLabel.js'
import { hashToken, newToken } from './tokens.js'

// Hoe lang je ingelogd blijft. Met "Ingelogd blijven" 30 dagen, anders tot de browser sluit (max. 12 uur).
export const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000
const SHORT_MS = 12 * 60 * 60 * 1000
// "Laatst actief" bijwerken kost een query; eens per 5 minuten is precies genoeg voor de lijst met apparaten.
const TOUCH_EVERY_MS = 5 * 60 * 1000

/**
 * Nieuwe sessie na inloggen of registreren.
 * @returns {{ token: string, maxAge: number | null }} token voor de cookie; maxAge null = cookie tot de browser sluit
 */
export async function createUserSession(userId, { remember = false, userAgent } = {}) {
  const token = newToken()
  const lifetime = remember ? REMEMBER_MS : SHORT_MS
  // Verlopen sessies van deze gebruiker meteen opruimen, zodat de tabel niet blijft groeien.
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lte: new Date() } } })
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      deviceLabel: deviceLabel(userAgent),
      expiresAt: new Date(Date.now() + lifetime),
    },
  })
  return { token, maxAge: remember ? REMEMBER_MS : null }
}

/** De sessie (met gebruiker) bij een cookie-token, of null als hij niet bestaat of verlopen is. */
export async function findSession(token) {
  if (typeof token !== 'string' || !token) return null
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { id: session.id } })
    return null
  }

  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    const now = new Date()
    // Niet op wachten: de gebruiker hoeft niet te wachten op een statistiek.
    prisma
      .$transaction([
        prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: now } }),
        prisma.user.update({ where: { id: session.userId }, data: { lastActiveAt: now } }),
      ])
      .catch((error) => console.error('Laatst actief niet bijgewerkt:', error.message))
  }
  return session
}

export function deleteSession(sessionId) {
  return prisma.session.deleteMany({ where: { id: sessionId } })
}

/** Uitloggen op alle andere apparaten (story 9), of na een wachtwoordwijziging. */
export function deleteOtherSessions(userId, keepSessionId) {
  return prisma.session.deleteMany({ where: { userId, id: { not: keepSessionId } } })
}

export function deleteAllSessions(userId) {
  return prisma.session.deleteMany({ where: { userId } })
}

export function listSessions(userId) {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: 'desc' },
    select: { id: true, deviceLabel: true, lastSeenAt: true, createdAt: true },
  })
}
