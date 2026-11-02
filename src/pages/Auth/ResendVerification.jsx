import { useState } from 'react'
import { api } from '../../api/http.js'

/**
 * Knop "Mail opnieuw sturen" voor de bevestigingsmail (story 14).
 * Staat na het registreren, op /inloggen bij een onbevestigd account en op /email-bevestigen bij een verlopen link.
 * De server antwoordt altijd hetzelfde, dus ook wij zeggen niet of het adres een account heeft.
 * @param {{ email: string }} props
 */
export default function ResendVerification({ email }) {
  const [state, setState] = useState('idle') // idle → busy → sent
  const [error, setError] = useState(null)

  async function resend() {
    setError(null)
    setState('busy')
    try {
      await api('/auth/resend-verification', { method: 'POST', body: { email } })
      setState('sent')
    } catch (apiError) {
      setError(apiError.message)
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <p className="auth-page__switch" role="status">
        Verstuurd! Je krijgt binnen een paar minuten een nieuwe mail. Niets ontvangen? Kijk ook in je spam.
      </p>
    )
  }
  return (
    <>
      <button type="button" className="ui-btn ui-btn--block" onClick={resend} disabled={state === 'busy' || !email.trim()}>
        {state === 'busy' ? 'Versturen…' : 'Mail opnieuw sturen'}
      </button>
      {error && <p className="ui-field-error">{error}</p>}
    </>
  )
}
