import { rateLimit } from 'express-rate-limit'

// Grenzen tegen misbruik: wachtwoorden raden, of iemands inbox volspammen met "wachtwoord vergeten".
//
// Waarom per e-mailadres en niet per IP-adres? In een klaslokaal zitten 30 studenten achter hetzelfde
// wifi-adres (en in development komt alles via de Vite-proxy). Een grens per IP zou dan de hele klas blokkeren.

function tooMany(message) {
  return (_request, response) => response.status(429).json({ error: 'TOO_MANY_REQUESTS', message })
}

const emailKey = (prefix) => (request) => `${prefix}:${String(request.body?.email ?? '').trim().toLowerCase()}`

// 10 inlogpogingen per e-mailadres per 15 minuten. Gelukte pogingen tellen niet mee.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: emailKey('login'),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooMany('Te veel pogingen. Probeer het over een kwartier opnieuw.'),
})

// Mails opnieuw aanvragen: 5 per e-mailadres per kwartier.
// Bij te veel een eerlijke 429 met uitleg. Vroeger zei de server dan gewoon "verstuurd" zonder iets te sturen,
// en dacht de gebruiker dat "opnieuw sturen" kapot was.
// Verraadt een 429 welke adressen een account hebben? Nee: de teller loopt voor élk adres, ook een onbekend adres.
const MAIL_WINDOW_MS = 15 * 60 * 1000
const MAIL_LIMIT = 5
const tooManyMails = tooMany('Je hebt al een paar mails aangevraagd. Kijk in je inbox (en spam), of probeer het over een kwartier opnieuw.')

export const forgotLimiter = rateLimit({
  windowMs: MAIL_WINDOW_MS,
  limit: MAIL_LIMIT,
  keyGenerator: emailKey('forgot'),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyMails,
})

// Bevestigingsmail opnieuw sturen (story 14): dezelfde grens.
export const resendVerificationLimiter = rateLimit({
  windowMs: MAIL_WINDOW_MS,
  limit: MAIL_LIMIT,
  keyGenerator: emailKey('verify'),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyMails,
})

// Registreren: ruim, want een hele klas maakt tegelijk een account aan. Alleen tegen scripts die duizenden accounts maken.
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooMany('Te veel nieuwe accounts in korte tijd. Probeer het straks opnieuw.'),
})

// Wachtwoord wijzigen en account verwijderen vragen je huidige wachtwoord. Zonder grens kan iemand die even
// achter jouw ingelogde laptop zit, eindeloos wachtwoorden proberen. 10 foute pogingen per account per 15 minuten.
export const passwordCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  // id + aanmaakmoment: uniek per account, ook als een id na het legen van de database opnieuw wordt uitgedeeld.
  keyGenerator: (request) => `password-check:${request.user?.id}:${request.user?.createdAt?.getTime()}`,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooMany('Te veel pogingen. Probeer het over een kwartier opnieuw.'),
})
