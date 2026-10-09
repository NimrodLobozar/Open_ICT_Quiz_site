import { parse } from 'cookie'

// Eén plek voor alle sessiecookies (projectplan 6.1).
export const PLAYER_COOKIE = 'quiz_player'
export const HOST_COOKIE = 'quiz_host'

const FOUR_HOURS = 4 * 60 * 60 * 1000

function cookieOptions() {
  return {
    httpOnly: true, // JavaScript in de browser kan de token niet lezen of stelen
    sameSite: 'lax',
    path: '/',
    // secure = alleen over HTTPS. In development draaien we op http://, dan zou de cookie nooit verstuurd worden.
    secure: process.env.NODE_ENV === 'production',
  }
}

export function setSessionCookie(response, name, token) {
  // Altijd maxAge: zonder maxAge verdwijnt de cookie als de browser sluit, en werkt rejoinen niet.
  response.cookie(name, token, { ...cookieOptions(), maxAge: FOUR_HOURS })
}

export function clearSessionCookie(response, name) {
  // Wissen werkt alleen met dezelfde opties (path enzovoort) als waarmee de cookie gezet is.
  response.clearCookie(name, cookieOptions())
}

/** Leest de cookies uit een Cookie-header. Werkt voor Express-requests én de Socket.IO-handshake. */
export function readCookies(cookieHeader) {
  return parse(cookieHeader ?? '')
}
