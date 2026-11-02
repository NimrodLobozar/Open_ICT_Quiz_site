/**
 * Maakt van de User-Agent van de browser een kort, leesbaar label voor de lijst "Ingelogd op" (story 9),
 * bijv. "Telefoon · Safari" of "Computer · Chrome".
 * We bewaren bewust alleen dit label, niet de hele User-Agent of het IP-adres: minder persoonsgegevens (AVG).
 * @param {string | undefined} userAgent
 */
export function deviceLabel(userAgent) {
  const ua = String(userAgent ?? '')
  if (!ua) return 'Onbekend apparaat'

  const device = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'Telefoon' : 'Computer'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : null
  return browser ? `${device} · ${browser}` : device
}
