// Eén helper voor ALLE sessiecookies (zie docs/PROJECTPLAN.md hoofdstuk 6.1).
// Gebruik nooit res.cookie() direct: zo hebben alle cookies dezelfde (veilige) instellingen.
import { parseCookie } from 'cookie'
import { config } from '../config.js'
import { gameManager, SESSION_MAX_AGE_MS } from '../game/GameManager.js'

export const PLAYER_COOKIE = 'quiz_player'
export const HOST_COOKIE = 'quiz_host'
export const AUTH_COOKIE = 'quiz_auth' // TODO(team, L1): ingelogd account, 7 dagen geldig

function baseOptions() {
  return {
    httpOnly: true, // JavaScript in de browser kan er niet bij
    sameSite: 'lax',
    path: '/',
    secure: config.isProduction, // alleen via HTTPS in productie
  }
}

/**
 * @param {import('express').Response} res
 * @param {string} name PLAYER_COOKIE, HOST_COOKIE of AUTH_COOKIE
 * @param {string} token
 * @param {number} [maxAgeMs]
 */
export function setSessionCookie(res, name, token, maxAgeMs = SESSION_MAX_AGE_MS) {
  // ALTIJD een maxAge: zonder maxAge verdwijnt de cookie als de browser sluit → geen rejoin.
  res.cookie(name, token, { ...baseOptions(), maxAge: maxAgeMs })
}

export function clearSessionCookie(res, name) {
  res.clearCookie(name, baseOptions())
}

/**
 * Leest de sessie uit een cookie van een Express-request (via cookie-parser).
 * @returns {{ token: string, gameCode: string, playerId: string | null, role: string } | null}
 */
export function readSession(req, name) {
  const token = req.cookies?.[name]
  const session = gameManager.getSession(token)
  return session ? { token, ...session } : null
}

/**
 * Zelfde als readSession, maar voor de ruwe Cookie-header (Socket.IO-handshake).
 * @param {string | undefined} cookieHeader
 * @param {string} name
 */
export function readSessionFromHeader(cookieHeader, name) {
  const token = parseCookie(cookieHeader ?? '')[name]
  const session = gameManager.getSession(token)
  return session ? { token, ...session } : null
}
