import { Router } from 'express'
import { noStore, requireRole } from '../auth/middleware.js'
import { createOneTimeToken } from '../auth/oneTimeTokens.js'
import { deleteUserError, roleChangeError } from '../auth/roleRules.js'
import { deleteAllSessions } from '../auth/sessions.js'
import { parseHuEmail, parseId, parsePage, parseSearch, parseUsername } from '../auth/validate.js'
import { getOverviewStats, getRound, listRounds } from '../db/results.js'
import { createUser, deleteUser, findUserById, listUsers, publicUser, updateUser } from '../db/users.js'
import { appUrl, teacherInviteMail, trySendMail } from '../mail/sendMail.js'
import { ApiError } from '../utils/ApiError.js'

// Het admin-portaal (story 7, 10, 11 en 12).
// Overzicht en uitslagen zijn voor docenten én beheerders; gebruikersbeheer alleen voor beheerders.
// De rol wordt hier op de server gecontroleerd. Dat het menu-item in de frontend verborgen is, beveiligt niets.
const router = Router()
router.use(noStore)

const staff = requireRole('TEACHER', 'ADMIN')
const adminOnly = requireRole('ADMIN')

const ERROR_MESSAGES = {
  INVALID_ROLE: 'Deze rol bestaat niet.',
  OWN_ADMIN_ROLE: 'Je kunt je eigen beheerdersrol niet weghalen. Vraag een andere beheerder.',
  DELETE_SELF: 'Je kunt je eigen account hier niet verwijderen. Dat doe je via Mijn account.',
}

/**
 * Nieuwe uitnodigingslink maken en mailen (story 11 en 13). Oudere links werken daarna niet meer.
 * Lukt de mail niet, dan krijgt de beheerder de link zelf, zodat hij hem kan doorsturen.
 */
async function sendInvite(user) {
  const inviteLink = `${appUrl()}/wachtwoord-instellen?token=${await createOneTimeToken(user.id, 'INVITE')}`
  const mailSent = await trySendMail(() => teacherInviteMail(user.email, user.username, inviteLink))
  return mailSent ? { mailSent } : { mailSent, inviteLink }
}

async function findTarget(request) {
  const user = await findUserById(parseId(request.params.id))
  if (!user) throw new ApiError('USER_NOT_FOUND', 'Deze gebruiker bestaat niet.', 404)
  return user
}

router.get('/stats', staff, async (request, response) => {
  response.json(await getOverviewStats(request.user))
})

// ---------- Uitslagen ----------

router.get('/results', staff, async (request, response) => {
  response.json(
    await listRounds(request.user, { q: parseSearch(request.query.q), page: parsePage(request.query.page) }),
  )
})

router.get('/results/:id', staff, async (request, response) => {
  response.json(await getRound(parseId(request.params.id), request.user))
})

// ---------- Gebruikers (alleen beheerders) ----------

// Story 10: lijst met filter op rol, zoeken en pagina's.
router.get('/users', adminOnly, async (request, response) => {
  const role = ['STUDENT', 'TEACHER', 'ADMIN'].includes(request.query.role) ? request.query.role : null
  response.json(await listUsers({ role, q: parseSearch(request.query.q), page: parsePage(request.query.page) }))
})

// Story 11: docent toevoegen. De docent kiest zelf een wachtwoord via een uitnodigingslink.
// Ook een docent heeft een HU-adres nodig (story 14).
router.post('/users', adminOnly, async (request, response) => {
  const { username, usernameKey } = parseUsername(request.body?.username)
  const email = parseHuEmail(request.body?.email)
  // passwordHash null: inloggen kan pas als de docent zijn link heeft gebruikt.
  const user = await createUser({ username, usernameKey, email, passwordHash: null, role: 'TEACHER' })
  // Het account bestaat al, ook als de mail mislukt: dan ziet de beheerder mailSent: false en stuurt hij opnieuw.
  response.status(201).json({ user: publicUser(user), ...(await sendInvite(user)) })
})

// Story 13: uitnodiging opnieuw sturen, voor een docent die zijn account nog niet heeft geactiveerd.
router.post('/users/:id/resend-invite', adminOnly, async (request, response) => {
  const target = await findTarget(request)
  if (target.passwordHash) {
    throw new ApiError('ALREADY_ACTIVATED', 'Dit account is al geactiveerd. Gebruik "Wachtwoord vergeten" op de inlogpagina.', 409)
  }
  response.json(await sendInvite(target))
})

// Story 12: naam of e-mailadres van een gebruiker aanpassen.
router.patch('/users/:id', adminOnly, async (request, response) => {
  const target = await findTarget(request)
  const body = request.body ?? {}
  const data = {}
  if (body.username !== undefined) Object.assign(data, parseUsername(body.username))
  // Alleen een nieuw adres moet een HU-adres zijn; zo kun je de seed-beheerder nog steeds een andere naam geven.
  if (body.email !== undefined && body.email.trim?.().toLowerCase() !== target.email) data.email = parseHuEmail(body.email)
  const user = await updateUser(target.id, data)
  response.json({ user: publicUser(user) })
})

// Story 11: rol wijzigen.
router.patch('/users/:id/role', adminOnly, async (request, response) => {
  const target = await findTarget(request)
  const role = request.body?.role
  const error = roleChangeError(request.user, target, role)
  if (error) throw new ApiError(error, ERROR_MESSAGES[error], error === 'INVALID_ROLE' ? 400 : 409)

  const user = await updateUser(target.id, { role })
  // Minder rechten? Dan opnieuw inloggen, zodat open tabbladen niet met de oude rol verder werken.
  // (De rol wordt per request uit de database gelezen, dus dit is extra voorzichtig.)
  if (role !== target.role) await deleteAllSessions(target.id)
  response.json({ user: publicUser(user) })
})

// Story 12: gebruiker verwijderen. Zelfde verwijderlogica als story 6, zodat oude uitslagen blijven kloppen.
router.delete('/users/:id', adminOnly, async (request, response) => {
  const target = await findTarget(request)
  const error = deleteUserError(request.user, target)
  if (error) throw new ApiError(error, ERROR_MESSAGES[error], 409)
  await deleteUser(target.id)
  response.json({ ok: true })
})

export default router
