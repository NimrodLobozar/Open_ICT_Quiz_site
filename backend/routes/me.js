import { Router } from 'express'
import { noStore, requireAuth, requireRole } from '../auth/middleware.js'
import { createOneTimeToken, PASSWORD_PURPOSES } from '../auth/oneTimeTokens.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { emailChangeLimiter, passwordCheckLimiter } from '../auth/rateLimits.js'
import { deleteOtherSessions, listSessions } from '../auth/sessions.js'
import { parseHuEmail, parsePassword, parseUsername } from '../auth/validate.js'
import { prisma } from '../db/prisma.js'
import { getMyResults } from '../db/results.js'
import { lockUser } from '../db/locks.js'
import { deleteUser, publicUser, uniqueError, updateUser } from '../db/users.js'
import { appUrl, newEmailMail } from '../mail/sendMail.js'
import { cleanQuizDefaults } from '../quiz/quizRules.js'
import { cleanAccountSkills } from '../../src/utils/skills.js'
import { ApiError } from '../utils/ApiError.js'
import { AUTH_COOKIE, clearSessionCookie } from '../utils/cookies.js'

// Alles over je eigen account (story 4, 5, 6, 8 en 9).
// Er staat nergens een gebruikers-id in de URL: het account komt altijd uit je sessie.
// Zo kun je niet per ongeluk (of expres) andermans gegevens opvragen of wijzigen.
const router = Router()
router.use(noStore, requireAuth)

// Story 4: eigen resultaten. ?all=1 voor alle rondes in plaats van de laatste 5.
router.get('/results', async (request, response) => {
  response.json(await getMyResults(request.user.id, { all: request.query.all === '1' }))
})

// Story 5: gebruikersnaam, e-mailadres en vaardigheden aanpassen. Wat je niet meestuurt, blijft hetzelfde.
router.patch('/', emailChangeLimiter, async (request, response) => {
  const body = request.body ?? {}
  const data = {}
  if (body.username !== undefined) Object.assign(data, parseUsername(body.username))
  // Een nieuw adres moet een HU-adres zijn (story 14). Het huidige adres mag blijven staan,
  // ook als dat geen HU-adres is (bijv. de seed-beheerder), want het formulier stuurt het altijd mee.
  // typeof-check: bij email: null of een getal geeft parseHuEmail een nette 400 in plaats van een crash.
  const typed = typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email
  if (body.skills !== undefined) data.skills = cleanAccountSkills(body.skills)

  // Eén transactie met de gebruiker op slot. Dezelfde slot als bij het gebruiken van de bevestigingslink
  // (markUsed in oneTimeTokens.js), dus een link kan nooit een adres bevestigen dat er tegelijk ingezet werd.
  let mail = null
  const userId = request.user.id
  const user = await prisma
    .$transaction(async (tx) => {
      await lockUser(tx, userId)
      const current = await tx.user.findUnique({ where: { id: userId } })
      if (body.email !== undefined && typed === current.email) {
        // Terug naar het huidige adres: een openstaande wijziging vervalt, en de link ervan ook.
        if (current.pendingEmail) {
          data.pendingEmail = null
          await tx.oneTimeToken.deleteMany({ where: { userId, purpose: 'VERIFY', usedAt: null } })
        }
      } else if (body.email !== undefined && current.pendingEmail && typed === current.pendingEmail) {
        // Het adres dat al op bevestiging wacht (Instellingen toont dat in het veld): niets veranderen,
        // zodat de link die al in de mail zit gewoon blijft werken.
      } else if (body.email !== undefined) {
        const newEmail = parseHuEmail(body.email)
        // Het nieuwe adres wordt pas echt je adres als je het bevestigt via de mail (zie useVerifyToken).
        // Anders kon je het HU-adres van een ander "bezetten" zonder toegang tot die mailbox.
        if (await tx.user.findUnique({ where: { email: newEmail } })) {
          throw new ApiError('EMAIL_TAKEN', 'Dit e-mailadres heeft al een account.', 409)
        }
        data.pendingEmail = newEmail
        // Alleen de nieuwste bevestigingslink werkt: een oude link mag geen ander (eerder getypt) adres bevestigen.
        await tx.oneTimeToken.deleteMany({ where: { userId, purpose: 'VERIFY', usedAt: null } })
        mail = { to: newEmail, token: await createOneTimeToken(userId, 'VERIFY', tx) }
      }
      return tx.user.update({ where: { id: userId }, data })
    })
    .catch((error) => {
      throw uniqueError(error) ?? error
    })

  if (mail) {
    // Pas ná de transactie, en zonder erop te wachten: een trage maildienst mag het opslaan niet ophouden.
    // Komt de mail niet aan, dan typ je het adres opnieuw en sla je nog een keer op.
    newEmailMail(mail.to, user.username, `${appUrl()}/email-bevestigen?token=${mail.token}`).catch((error) =>
      console.error('Bevestigingsmail voor nieuw adres niet verstuurd:', error.message),
    )
  }
  response.json({ user: publicUser(user) })
})

// Bevestigingsmail voor het wachtende nieuwe adres opnieuw sturen: de mail kwam niet aan, of de link is verlopen.
// Eerdere links naar hetzelfde adres blijven werken tot ze verlopen (zie createOneTimeToken); een link naar een
// ánder adres bestaat niet meer, want die zijn gewist toen je dit adres koos.
router.post('/email/resend', emailChangeLimiter, async (request, response) => {
  const userId = request.user.id
  const mail = await prisma.$transaction(async (tx) => {
    // Zelfde slot als PATCH /api/me: zo hoort de nieuwe link altijd bij het adres dat nu wacht.
    await lockUser(tx, userId)
    const current = await tx.user.findUnique({ where: { id: userId } })
    if (!current.pendingEmail) return null
    return { to: current.pendingEmail, username: current.username, token: await createOneTimeToken(userId, 'VERIFY', tx) }
  })
  if (!mail) throw new ApiError('NO_PENDING_EMAIL', 'Er wacht geen nieuw e-mailadres op bevestiging.', 400)
  // Hier wél wachten op de mail: de knop zegt "verstuurd", dus dat moet ook kloppen.
  await newEmailMail(mail.to, mail.username, `${appUrl()}/email-bevestigen?token=${mail.token}`)
  response.json({ ok: true })
})

// Story 5: wachtwoord wijzigen. Eerst het huidige wachtwoord, zodat iemand die even achter je laptop zit
// niet zomaar je wachtwoord kan veranderen.
router.post('/password', passwordCheckLimiter, async (request, response) => {
  const { currentPassword, newPassword } = request.body ?? {}

  const ok = await verifyPassword(currentPassword, request.user.passwordHash)
  if (!ok) throw new ApiError('WRONG_PASSWORD', 'Je huidige wachtwoord klopt niet.', 400)

  const password = parsePassword(newPassword)
  // Hetzelfde wachtwoord opnieuw "kiezen" is geen wijziging: was het oude gelekt, dan ben je nog steeds niet veilig.
  // currentPassword is hierboven al gecontroleerd, dus een gewone vergelijking is genoeg.
  if (password === currentPassword) {
    throw new ApiError('PASSWORD_SAME', 'Je nieuwe wachtwoord mag niet hetzelfde zijn als je huidige wachtwoord.', 400)
  }
  const passwordHash = await hashPassword(password)
  const userId = request.user.id
  // Alles in één transactie, zodat het nooit half gebeurt:
  // - nieuw wachtwoord;
  // - openstaande "wachtwoord vergeten"-links vervallen. Anders kon iemand met een oude link
  //   jouw nieuwe wachtwoord meteen weer overschrijven;
  // - andere apparaten uitloggen: was je wachtwoord gelekt, dan is de indringer er nu uit. Dit apparaat blijft ingelogd.
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.oneTimeToken.deleteMany({ where: { userId, purpose: { in: PASSWORD_PURPOSES }, usedAt: null } }),
    prisma.session.deleteMany({ where: { userId, id: { not: request.authSession.id } } }),
  ])
  response.json({ ok: true })
})

// Story 6: account verwijderen. Met wachtwoord als bevestiging: per ongeluk verwijderen moet zo goed als onmogelijk zijn.
router.delete('/', passwordCheckLimiter, async (request, response) => {
  const ok = await verifyPassword(request.body?.password, request.user.passwordHash)
  if (!ok) throw new ApiError('WRONG_PASSWORD', 'Je wachtwoord klopt niet.', 400)

  await deleteUser(request.user.id)
  clearSessionCookie(response, AUTH_COOKIE)
  response.json({ ok: true })
})

// Story 9: op welke apparaten ben ik ingelogd?
router.get('/sessions', async (request, response) => {
  const sessions = await listSessions(request.user.id)
  response.json({
    sessions: sessions.map((session) => ({ ...session, current: session.id === request.authSession.id })),
  })
})

// Story 9: overal uitloggen, behalve hier.
router.post('/sessions/revoke-others', async (request, response) => {
  const { count } = await deleteOtherSessions(request.user.id, request.authSession.id)
  response.json({ ok: true, revoked: count })
})

// Story 8: standaardinstellingen voor nieuwe quizzen (alleen docenten en beheerders maken quizzen).
router.get('/quiz-defaults', requireRole('TEACHER', 'ADMIN'), (request, response) => {
  response.json({ defaults: cleanQuizDefaults(request.user.quizDefaults) })
})

router.put('/quiz-defaults', requireRole('TEACHER', 'ADMIN'), async (request, response) => {
  // cleanQuizDefaults houdt alleen bekende instellingen met geldige waarden over.
  const defaults = cleanQuizDefaults(request.body)
  await updateUser(request.user.id, { quizDefaults: defaults })
  response.json({ defaults })
})

export default router
