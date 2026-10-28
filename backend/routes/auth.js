import { Router } from 'express'
import { noStore } from '../auth/middleware.js'
import {
  createOneTimeToken,
  findUsableToken,
  PASSWORD_PURPOSES,
  usePasswordToken,
  useVerifyToken,
} from '../auth/oneTimeTokens.js'
import { DUMMY_HASH, hashPassword, verifyPassword } from '../auth/password.js'
import { forgotLimiter, loginLimiter, registerLimiter, resendVerificationLimiter } from '../auth/rateLimits.js'
import { createUserSession, deleteSession } from '../auth/sessions.js'
import { parseHuEmail, parsePassword, parseUsername } from '../auth/validate.js'
import { createUser, deleteExpiredUnverified, findUserByEmail, publicUser } from '../db/users.js'
import { appUrl, passwordResetMail, verifyEmailMail } from '../mail/sendMail.js'
import { ApiError } from '../utils/ApiError.js'
import { AUTH_COOKIE, clearSessionCookie, setSessionCookie } from '../utils/cookies.js'

// Inloggen, registreren, uitloggen, wachtwoord vergeten en e-mail bevestigen (story 1, 2, 3 en 14).
// Allemaal REST: alleen een HTTP-antwoord kan de httpOnly-cookie zetten of wissen.
const router = Router()
router.use(noStore)

async function startSession(request, response, user, remember) {
  const { token, maxAge } = await createUserSession(user.id, {
    remember: Boolean(remember),
    userAgent: request.headers['user-agent'],
  })
  setSessionCookie(response, AUTH_COOKIE, token, maxAge)
}

// Story 1 + 14: account aanmaken, alleen met een HU-adres. Je bent daarna nog níet ingelogd:
// eerst bevestig je via de link in de mail dat het adres van jou is.
router.post('/register', registerLimiter, async (request, response) => {
  const body = request.body ?? {}
  if (body.acceptPrivacy !== true) {
    throw new ApiError('PRIVACY_REQUIRED', 'Ga akkoord met de privacyregels om een account te maken.', 400)
  }
  const { username, usernameKey } = parseUsername(body.username)
  const email = parseHuEmail(body.email)
  const password = parsePassword(body.password)

  // Een oud, nooit bevestigd account met dit adres of deze naam houdt het niet langer bezet.
  await deleteExpiredUnverified({ email, usernameKey })
  // De rol staat hier vast op STUDENT. Stuurt iemand role: 'ADMIN' mee, dan negeren we dat (story 11).
  const user = await createUser({
    username,
    usernameKey,
    email,
    passwordHash: await hashPassword(password),
    role: 'STUDENT',
  })
  // Niet wachten op de mail: een trage maildienst mag het registreren niet ophouden.
  // Komt de mail niet aan, dan vraagt de speler hem opnieuw aan (resend-verification).
  sendVerifyMail(user).catch((error) => console.error('Bevestigingsmail niet verstuurd:', error.message))
  response.status(201).json({ user: publicUser(user), verificationSent: true })
})

async function sendVerifyMail(user) {
  const token = await createOneTimeToken(user.id, 'VERIFY')
  await verifyEmailMail(user.email, user.username, `${appUrl()}/email-bevestigen?token=${token}`)
}

// Story 14: de link uit de bevestigingsmail.
router.post('/verify-email', async (request, response) => {
  const ok = await useVerifyToken(request.body?.token)
  if (!ok) {
    throw new ApiError('LINK_INVALID', 'Deze link is verlopen of al gebruikt. Vraag een nieuwe bevestigingsmail aan.', 400)
  }
  response.json({ ok: true })
})

// Story 14: bevestigingsmail opnieuw sturen. Altijd hetzelfde antwoord, net als bij wachtwoord vergeten:
// zo kan niemand hiermee uitzoeken welke adressen een account hebben.
router.post('/resend-verification', resendVerificationLimiter, (request, response) => {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  resendVerifyMail(email).catch((error) => console.error('Bevestigingsmail niet verstuurd:', error.message))
  response.json({ ok: true })
})

async function resendVerifyMail(email) {
  const user = email ? await findUserByEmail(email) : null
  // Al bevestigd, of een docent zonder wachtwoord (die gebruikt zijn uitnodiging): geen mail.
  if (!user || user.emailVerifiedAt || !user.passwordHash) return
  await sendVerifyMail(user)
}

// Story 2: inloggen.
router.post('/login', loginLimiter, async (request, response) => {
  const body = request.body ?? {}
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const user = email ? await findUserByEmail(email) : null

  // Altijd een bcrypt-vergelijking, ook als het account niet bestaat (dan met DUMMY_HASH).
  // Anders is "e-mailadres onbekend" sneller dan "wachtwoord fout", en verraadt de tijd welke adressen bestaan.
  const passwordOk = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !user.passwordHash || !passwordOk) {
    // Eén melding voor beide gevallen: niet verraden of het e-mailadres of het wachtwoord fout is.
    throw new ApiError('INVALID_LOGIN', 'E-mailadres of wachtwoord klopt niet.', 401)
  }
  // Pas ná het juiste wachtwoord: anders verraadt deze melding welke adressen een account hebben.
  if (!user.emailVerifiedAt) {
    throw new ApiError('EMAIL_NOT_VERIFIED', 'Bevestig eerst je e-mailadres via de link in je mail.', 403)
  }

  await startSession(request, response, user, body.remember)
  response.json({ user: publicUser(user) })
})

router.post('/logout', async (request, response) => {
  if (request.authSession) await deleteSession(request.authSession.id)
  // Cookie altijd wissen, ook als de sessie al weg was: dan begint de browser schoon.
  clearSessionCookie(response, AUTH_COOKIE)
  response.json({ ok: true })
})

// Wie ben ik? 200 met user: null als je niet bent ingelogd, zodat de frontend geen foutmelding krijgt bij elk bezoek.
router.get('/me', (request, response) => {
  response.json({ user: request.user ? publicUser(request.user) : null })
})

// Story 3: wachtwoord vergeten. Altijd hetzelfde antwoord, of het adres nu bestaat of niet.
router.post('/forgot', forgotLimiter, (request, response) => {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  // Niet wachten op de database en de mail: dan duurt het antwoord altijd even lang,
  // en verraadt de tijd ook niet of het adres bestaat.
  sendResetMail(email).catch((error) => console.error('Resetmail niet verstuurd:', error.message))
  response.json({ ok: true })
})

async function sendResetMail(email) {
  const user = email ? await findUserByEmail(email) : null
  // Een uitgenodigde docent zonder wachtwoord gebruikt zijn uitnodiging, niet deze route.
  if (!user || !user.passwordHash) return
  const token = await createOneTimeToken(user.id, 'RESET')
  await passwordResetMail(user.email, `${appUrl()}/wachtwoord-instellen?token=${token}`)
}

// Voor de pagina "Nieuw wachtwoord": is deze link nog geldig, en voor wie? (zonder hem te gebruiken)
router.get('/password-link', async (request, response) => {
  const record = await findUsableToken(request.query.token, PASSWORD_PURPOSES)
  if (!record) throw linkInvalid()
  response.json({ purpose: record.purpose, username: record.user.username })
})

// Nieuw wachtwoord via een link (story 3), of eerste wachtwoord van een docent (story 11).
router.post('/password', async (request, response) => {
  const password = parsePassword(request.body?.password)
  const ok = await usePasswordToken(request.body?.token, password)
  if (!ok) throw linkInvalid()
  // Na een reset log je opnieuw in: zo weet je zeker dat het nieuwe wachtwoord werkt.
  clearSessionCookie(response, AUTH_COOKIE)
  response.json({ ok: true })
})

function linkInvalid() {
  return new ApiError('LINK_INVALID', 'Deze link is verlopen of al gebruikt. Vraag een nieuwe aan.', 400)
}

export default router
