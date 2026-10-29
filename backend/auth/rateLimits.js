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

// 3 resetmails per e-mailadres per uur.
export const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: emailKey('forgot'),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Zelfde antwoord als normaal: anders verraadt de 429 alsnog dat we dit adres kennen.
  handler: (_request, response) => response.json({ ok: true }),
})

// 3 bevestigingsmails per e-mailadres per uur (story 14). Zelfde antwoord als normaal, om dezelfde reden.
export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: emailKey('verify'),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => response.json({ ok: true }),
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
