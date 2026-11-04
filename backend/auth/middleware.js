import { ApiError } from '../utils/ApiError.js'
import { AUTH_COOKIE, readCookies } from '../utils/cookies.js'
import { findSession } from './sessions.js'

/**
 * Draait voor elke /api-request: wie is er ingelogd?
 * Zet request.user (of null) en request.authSession. Weigert zelf nooit iets;
 * dat doen requireAuth en requireRole op de routes die het nodig hebben.
 */
export async function loadUser(request, _response, next) {
  const token = readCookies(request.headers.cookie)[AUTH_COOKIE]
  const session = await findSession(token)
  request.authSession = session
  request.user = session?.user ?? null
  next()
}

/** Alleen voor ingelogde gebruikers. Anders 401: de frontend stuurt je dan naar het inlogscherm. */
export function requireAuth(request, _response, next) {
  if (!request.user) throw new ApiError('NOT_LOGGED_IN', 'Log eerst in.', 401)
  next()
}

/**
 * Alleen voor gebruikers met één van deze rollen, bijv. requireRole('ADMIN') of requireRole('TEACHER', 'ADMIN').
 * De rol komt uit de database (via de sessie), nooit uit iets dat de browser meestuurt.
 * Niet ingelogd → 401. Ingelogd maar verkeerde rol → 403.
 * @param {...('STUDENT' | 'TEACHER' | 'ADMIN')} roles
 */
export function requireRole(...roles) {
  return (request, _response, next) => {
    if (!request.user) throw new ApiError('NOT_LOGGED_IN', 'Log eerst in.', 401)
    if (!roles.includes(request.user.role)) {
      throw new ApiError('FORBIDDEN', 'Je hebt hier geen toegang toe.', 403)
    }
    next()
  }
}

/**
 * Persoonlijke gegevens mogen niet in de cache van de browser blijven staan.
 * Anders zie je na het uitloggen met de terugknop nog iemands account (story 2).
 */
export function noStore(_request, response, next) {
  response.set('Cache-Control', 'no-store')
  next()
}

/**
 * Bescherming tegen CSRF: een andere website die de browser stiekem een POST naar onze API laat doen.
 * Een gewoon HTML-formulier kan geen JSON sturen; alleen JavaScript kan dat, en dat mag van de browser
 * alleen naar dezelfde website (er staan geen CORS-headers op de API). Dus: een schrijfactie mét body moet JSON zijn.
 * Samen met sameSite: 'lax' op de cookies is dat genoeg.
 */
export function jsonBodyOnly(request, _response, next) {
  const writes = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
  const hasBody = Number(request.headers['content-length'] ?? 0) > 0 || request.headers['transfer-encoding']
  if (writes && hasBody && !request.is('application/json')) {
    throw new ApiError('JSON_ONLY', 'Stuur de gegevens als JSON.', 415)
  }
  next()
}
