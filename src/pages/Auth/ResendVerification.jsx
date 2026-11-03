import { useEffect, useState } from 'react'
import { api } from '../../api/http.js'

// Zo lang moet je wachten voordat je nóg een mail kunt aanvragen. Een mail is vaak pas na een
// minuutje binnen; zo vraag je niet vijf keer achter elkaar een mail aan (de server telt ook mee).
const WAIT_SECONDS = 30

/**
 * Knop "Mail opnieuw sturen", met een korte wachttijd na elke keer.
 * Na het versturen kun je het opnieuw proberen (vroeger bleef de knop daarna weg).
 * @param {{ send: () => Promise<unknown>, disabled?: boolean, startWaiting?: boolean }} props
 *   send = het verzoek naar de server. startWaiting = meteen beginnen met wachten
 *   (bijv. net na de eerste mail, zodat je niet direct een tweede aanvraagt).
 */
export function ResendButton({ send, disabled = false, startWaiting = false }) {
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(startWaiting ? WAIT_SECONDS : 0)

  // Elke seconde één tel minder, tot 0.
  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((left) => left - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  async function resend() {
    setError(null)
    setBusy(true)
    try {
      await send()
      setSent(true)
      setSecondsLeft(WAIT_SECONDS)
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  const waiting = secondsLeft > 0
  return (
    <>
      {sent && (
        <p className="auth-page__switch" role="status">
          Verstuurd! Je krijgt binnen een paar minuten een nieuwe mail. Niets ontvangen? Kijk ook in je spam.
        </p>
      )}
      <button type="button" className="ui-btn ui-btn--block" onClick={resend} disabled={disabled || busy || waiting}>
        {busy ? 'Versturen…' : waiting ? `Mail opnieuw sturen (over ${secondsLeft} s)` : 'Mail opnieuw sturen'}
      </button>
      {error && (
        <p className="ui-field-error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}

/**
 * Knop "Mail opnieuw sturen" voor de bevestigingsmail (story 14).
 * Staat na het registreren, op /inloggen bij een onbevestigd account en op /email-bevestigen bij een verlopen link.
 * De server antwoordt altijd hetzelfde, dus ook wij zeggen niet of het adres een account heeft.
 * @param {{ email: string, startWaiting?: boolean }} props
 */
export default function ResendVerification({ email, startWaiting = false }) {
  return (
    <ResendButton
      startWaiting={startWaiting}
      disabled={!email.trim()}
      send={() => api('/auth/resend-verification', { method: 'POST', body: { email } })}
    />
  )
}
