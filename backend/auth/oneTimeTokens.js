import { lockUser } from '../db/locks.js'
import { prisma } from '../db/prisma.js'
import { hashPassword } from './password.js'
import { isTokenUsable } from './tokenRules.js'
import { hashToken, newToken } from './tokens.js'

// Eenmalige links: "wachtwoord vergeten" (RESET, story 3), de uitnodiging voor een nieuwe docent (INVITE, story 11)
// en het bevestigen van je e-mailadres na registreren (VERIFY, story 14).
// Eén mechanisme voor drie doelen. Wel altijd het doel controleren: een bevestigingslink mag nooit
// een wachtwoord instellen (zie PASSWORD_PURPOSES).
const LIFETIME_MS = {
  RESET: 60 * 60 * 1000, // 1 uur: kort, want wie de mail onderschept, kan het account overnemen
  INVITE: 7 * 24 * 60 * 60 * 1000, // 7 dagen: een docent leest zijn mail niet altijd meteen
  VERIFY: 24 * 60 * 60 * 1000, // 1 dag: daarna mag iemand anders het adres opnieuw registreren
}

/** Met deze links kies je een wachtwoord. */
export const PASSWORD_PURPOSES = ['RESET', 'INVITE']

/**
 * Maakt een nieuwe link.
 * - RESET en VERIFY (de gebruiker vraagt zelf een nieuwe mail): eerdere links blijven werken tot ze verlopen.
 *   Een mail komt soms pas na een minuut binnen. Vroeg je intussen een nieuwe aan en klik je dan op de
 *   eerste mail, dan moet die gewoon werken. Zodra één link gebruikt is, vervallen de andere (zie markUsed).
 * - INVITE (de beheerder stuurt een uitnodiging opnieuw, bijv. naar een verbeterd adres): alleen de nieuwste werkt.
 */
export async function createOneTimeToken(userId, purpose, db = prisma) {
  // db: gewoon prisma, of de tx van een lopende transactie (zie PATCH /api/me), zodat de link in dezelfde transactie valt.
  const token = newToken()
  const created = await db.oneTimeToken.create({
    data: { tokenHash: hashToken(token), userId, purpose, expiresAt: new Date(Date.now() + LIFETIME_MS[purpose]) },
  })
  // Pas ná het maken opruimen, op id: komen twee aanvragen tegelijk binnen, dan blijft de nieuwste altijd staan.
  const old = purpose === 'INVITE' ? {} : { expiresAt: { lte: new Date() } }
  await db.oneTimeToken.deleteMany({ where: { userId, purpose, usedAt: null, id: { lt: created.id }, ...old } })
  return token
}

/**
 * De rij bij een link (met gebruiker), maar alleen als hij nog bruikbaar is én een van de gevraagde doelen heeft.
 * Anders null.
 * @param {string} token
 * @param {string[]} purposes
 */
export async function findUsableToken(token, purposes) {
  if (typeof token !== 'string' || !token) return null
  const record = await prisma.oneTimeToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  return record && purposes.includes(record.purpose) && isTokenUsable(record) ? record : null
}

/**
 * Markeert de link als gebruikt. false als een ander verzoek hem net eerder gebruikte.
 * De andere, nog ongebruikte links met hetzelfde doel vervallen dan: je hebt er maar één nodig.
 * @param {string[]} purposes de doelen die samen één soort link zijn (bijv. RESET en INVITE)
 */
async function markUsed(tx, record, purposes) {
  // Eerst de gebruiker op slot (FOR UPDATE). Gebruikt iemand twee verschillende links tegelijk, dan wacht
  // de tweede hier tot de eerste klaar is, in plaats van dat ze elkaars links proberen te wissen en vastlopen
  // (deadlock = serverfout). Daarna vindt de tweede zijn link al gewist en krijgt hij "link werkt niet".
  await lockUser(tx, record.userId)
  // "usedAt: null" in de where: klikt iemand twee keer tegelijk, dan lukt het maar één keer.
  const { count } = await tx.oneTimeToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  if (count === 0) return false
  await tx.oneTimeToken.deleteMany({
    where: { userId: record.userId, purpose: { in: purposes }, usedAt: null, id: { not: record.id } },
  })
  return true
}

/**
 * Gebruikt de link: nieuw wachtwoord instellen, link ongeldig maken en overal uitloggen.
 * @returns {Promise<boolean>} false als de link niet (meer) bruikbaar is
 */
export async function usePasswordToken(token, newPassword) {
  const record = await findUsableToken(token, PASSWORD_PURPOSES)
  if (!record) return false

  const passwordHash = await hashPassword(newPassword)
  return prisma.$transaction(async (tx) => {
    if (!(await markUsed(tx, record, PASSWORD_PURPOSES))) return false
    // De link kwam via de mail binnen, dus het adres is van deze persoon: meteen ook bevestigd (story 14).
    // Zo is een docent die zijn uitnodiging gebruikt ook bevestigd.
    // Een wachtend nieuw e-mailadres vervalt, met zijn bevestigingslinks: had een indringer zijn eigen adres
    // klaargezet, dan kan hij het account na deze reset niet alsnog overnemen. (Het adres is via deze link
    // hierboven al bevestigd, dus een VERIFY-link is ook niet meer nodig.)
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, pendingEmail: null, emailVerifiedAt: record.user.emailVerifiedAt ?? new Date() },
    })
    await tx.oneTimeToken.deleteMany({ where: { userId: record.userId, purpose: 'VERIFY', usedAt: null } })
    // Was het account overgenomen, dan is de indringer er nu ook uit.
    await tx.session.deleteMany({ where: { userId: record.userId } })
    return true
  })
}

/**
 * Bevestigt het e-mailadres via de link uit de bevestigingsmail (story 14).
 * @returns {Promise<boolean>} false als de link niet (meer) bruikbaar is
 */
export async function useVerifyToken(token) {
  const record = await findUsableToken(token, ['VERIFY'])
  if (!record) return false
  return confirmEmail(record).catch((error) => {
    // P2002: precies tegelijk registreerde iemand anders met het nieuwe adres. Dan gaat het niet door.
    if (error?.code === 'P2002') return false
    throw error
  })
}

function confirmEmail(record) {
  return prisma.$transaction(async (tx) => {
    if (!(await markUsed(tx, record, ['VERIFY']))) return false
    // markUsed zette de gebruiker op slot, dus pendingEmail is hier de actuele waarde.
    const user = await tx.user.findUnique({ where: { id: record.userId } })
    const data = { emailVerifiedAt: new Date() }
    if (user.pendingEmail) {
      // Een nieuw adres van Instellingen: pas nu wordt het echt het adres van dit account.
      // Heeft iemand anders het intussen (geregistreerd of eerder bevestigd)? Dan gaat het niet door.
      const taken = await tx.user.findUnique({ where: { email: user.pendingEmail } })
      if (taken) {
        await tx.user.update({ where: { id: user.id }, data: { pendingEmail: null } })
        return false
      }
      Object.assign(data, { email: user.pendingEmail, pendingEmail: null })
      // De "wachtwoord vergeten"-links gingen naar het oude adres; die horen niet meer bij dit account.
      await tx.oneTimeToken.deleteMany({ where: { userId: user.id, purpose: 'RESET', usedAt: null } })
    }
    await tx.user.update({ where: { id: user.id }, data })
    return true
  })
}
