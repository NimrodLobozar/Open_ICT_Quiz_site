/**
 * Een fout die we bewust naar de client sturen, met een foutcode en een Nederlandse melding.
 * Zelfde vorm als GameError, zodat de frontend (src/api/http.js) beide hetzelfde leest:
 * { error: 'EMAIL_TAKEN', message: 'Dit e-mailadres heeft al een account.' }
 * Alles wat géén ApiError/GameError is, wordt een algemene 500 zonder details (zie app.js).
 */
export class ApiError extends Error {
  constructor(code, message, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}
