import { prisma } from '../db/prisma.js'
import { hashPassword } from './password.js'
import { isTokenUsable } from './tokenRules.js'
import { hashToken, newToken } from './tokens.js'

// Eenmalige links: "wachtwoord vergeten" (RESET, story 3) en de uitnodiging voor een nieuwe docent (INVITE, story 11).
// Eén mechanisme voor twee doelen: in beide gevallen kiest iemand via een link een nieuw wachtwoord.
const LIFETIME_MS = {
  RESET: 60 * 60 * 1000, // 1 uur: kort, want wie de mail onderschept, kan het account overnemen
  INVITE: 7 * 24 * 60 * 60 * 1000, // 7 dagen: een docent leest zijn mail niet altijd meteen
}

/** Maakt een nieuwe link. Oude, ongebruikte links van hetzelfde soort werken daarna niet meer. */
export async function createOneTimeToken(userId, purpose) {
  const token = newToken()
  const created = await prisma.oneTimeToken.create({
    data: { tokenHash: hashToken(token), userId, purpose, expiresAt: new Date(Date.now() + LIFETIME_MS[purpose]) },
  })
  // Pas daarna de oudere links weghalen, op id. Komen twee aanvragen tegelijk binnen,
  // dan blijft zo altijd precies de nieuwste over (eerst wissen en dan maken liet er soms twee staan).
  await prisma.oneTimeToken.deleteMany({ where: { userId, purpose, usedAt: null, id: { lt: created.id } } })
  return token
}

/** De rij bij een link (met gebruiker), maar alleen als hij nog bruikbaar is. Anders null. */
export async function findUsableToken(token) {
  if (typeof token !== 'string' || !token) return null
  const record = await prisma.oneTimeToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  return record && isTokenUsable(record) ? record : null
}

/**
 * Gebruikt de link: nieuw wachtwoord instellen, link ongeldig maken en overal uitloggen.
 * @returns {Promise<boolean>} false als de link niet (meer) bruikbaar is
 */
export async function usePasswordToken(token, newPassword) {
  const record = await findUsableToken(token)
  if (!record) return false

  const passwordHash = await hashPassword(newPassword)
  return prisma.$transaction(async (tx) => {
    // "usedAt: null" in de where: klikt iemand twee keer tegelijk, dan lukt het maar één keer.
    const { count } = await tx.oneTimeToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    })
    if (count === 0) return false
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } })
    // Was het account overgenomen, dan is de indringer er nu ook uit.
    await tx.session.deleteMany({ where: { userId: record.userId } })
    return true
  })
}
