import { Router } from 'express'
import { noStore, requireAuth, requireRole } from '../auth/middleware.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { passwordCheckLimiter } from '../auth/rateLimits.js'
import { deleteOtherSessions, listSessions } from '../auth/sessions.js'
import { parseEmail, parsePassword, parseUsername } from '../auth/validate.js'
import { prisma } from '../db/prisma.js'
import { getMyResults } from '../db/results.js'
import { deleteUser, publicUser, updateUser } from '../db/users.js'
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
router.patch('/', async (request, response) => {
  const body = request.body ?? {}
  const data = {}
  if (body.username !== undefined) Object.assign(data, parseUsername(body.username))
  if (body.email !== undefined) data.email = parseEmail(body.email)
  if (body.skills !== undefined) data.skills = cleanAccountSkills(body.skills)

  const user = await updateUser(request.user.id, data)
  // Nieuw e-mailadres? Dan werken oude "wachtwoord vergeten"-links (naar het oude adres) niet meer.
  if (data.email && data.email !== request.user.email) {
    await prisma.oneTimeToken.deleteMany({ where: { userId: user.id, usedAt: null } })
  }
  response.json({ user: publicUser(user) })
})

// Story 5: wachtwoord wijzigen. Eerst het huidige wachtwoord, zodat iemand die even achter je laptop zit
// niet zomaar je wachtwoord kan veranderen.
router.post('/password', passwordCheckLimiter, async (request, response) => {
  const { currentPassword, newPassword } = request.body ?? {}

  // USER IMPLEMENTATION (S5): controleer hier het huidige wachtwoord met verifyPassword(...)
  // (kijk hoe router.delete('/') verderop het doet). Klopt het niet: ApiError 'WRONG_PASSWORD', status 400.
  // Tot je dit invult, kan niemand zijn wachtwoord wijzigen (veilig).
  // Stappenplan: docs/SPRINT-2-ZELF-IMPLEMENTEREN.md, opdracht S5. Test: npm run test:api (backend/tests/api/me.test.js)
  throw new ApiError('NOT_IMPLEMENTED', 'USER IMPLEMENTATION S5: wachtwoordcontrole is nog niet af.', 501)

  const password = parsePassword(newPassword)
  await updateUser(request.user.id, { passwordHash: await hashPassword(password) })
  // Andere apparaten uitloggen: was je wachtwoord gelekt, dan is de indringer er nu uit. Dit apparaat blijft ingelogd.
  await deleteOtherSessions(request.user.id, request.authSession.id)
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
