import { parse } from 'cookie'

// Eén plek voor alle sessiecookies (projectplan 6.1).
export const PLAYER_COOKIE = 'quiz_player'
export const HOST_COOKIE = 'quiz_host'
// Ingelogd account (sprint 2). Los van de game-cookies: inloggen verandert niets aan rejoinen.
export const AUTH_COOKIE = 'quiz_auth'

const FOUR_HOURS = 4 * 60 * 60 * 1000

function cookieOptions() {
  return {
    httpOnly: true, // JavaScript in de browser kan de token niet lezen of stelen
    sameSite: 'lax', // een andere website kan geen formulier naar onze API sturen mét deze cookie
    path: '/',
    // secure = alleen over HTTPS. In development draaien we op http://, dan zou de cookie nooit verstuurd worden.
    secure: process.env.NODE_ENV === 'production',
  }
}

/**
 * @param {number | null} [maxAge] in ms. null = de cookie verdwijnt als de browser sluit
 *   (inloggen zonder "Ingelogd blijven"). Game-cookies houden altijd 4 uur, anders werkt rejoinen niet.
 */
export function setSessionCookie(response, name, token, maxAge = FOUR_HOURS) {
  const options = cookieOptions()
  if (maxAge !== null) options.maxAge = maxAge
  response.cookie(name, token, options)
}

export function clearSessionCookie(response, name) {
  // Wissen werkt alleen met dezelfde opties (path enzovoort) als waarmee de cookie gezet is.
  response.clearCookie(name, cookieOptions())
}

/** Leest de cookies uit een Cookie-header. Werkt voor Express-requests én de Socket.IO-handshake. */
export function readCookies(cookieHeader) {
  return parse(cookieHeader ?? '')
}
