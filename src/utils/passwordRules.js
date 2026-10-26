// De eisen voor een wachtwoord. Gedeeld door frontend en backend (zoals ranking.js):
// de registratiepagina toont ze als vinkjes tijdens het typen, en de server controleert precies dezelfde regels.
// Zo kan het nooit gebeuren dat de pagina "goed" zegt en de server het toch weigert.

export const PASSWORD_RULES = [
  { id: 'length', label: 'Minstens 8 tekens', test: (password) => password.length >= 8 },
  // USER IMPLEMENTATION (S1): voeg hier nog twee regels toe, in dezelfde vorm als 'length' hierboven:
  //   id 'digit', label 'Een cijfer'       → test: zit er minstens één cijfer in?
  //   id 'upper', label 'Een hoofdletter'  → test: zit er minstens één hoofdletter in (ook É of Ö)?
  // Stappenplan: docs/SPRINT-2-ZELF-IMPLEMENTEREN.md, opdracht S1. Test: npx vitest run backend/tests/passwordRules.test.js
]

// bcrypt kijkt alleen naar de eerste 72 bytes. Langer zou stiekem afgekapt worden, dus dat weigeren we.
export const MAX_PASSWORD_BYTES = 72

/**
 * Per regel: voldoet het wachtwoord eraan?
 * @returns {Array<{ id: string, label: string, ok: boolean }>}
 */
export function checkPassword(password) {
  const value = String(password ?? '')
  return PASSWORD_RULES.map(({ id, label, test }) => ({ id, label, ok: test(value) }))
}

/** true als het wachtwoord aan álle regels voldoet en niet te lang is. */
export function isStrongPassword(password) {
  if (typeof password !== 'string') return false
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) return false
  return checkPassword(password).every((rule) => rule.ok)
}
