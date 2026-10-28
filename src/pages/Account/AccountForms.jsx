import { useState } from 'react'
import { api } from '../../api/http.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Notice, PasswordChecklist, PasswordField, SkillSliders, TextField } from '../../components/AccountUi.jsx'
import { isStrongPassword } from '../../utils/passwordRules.js'
import { HU_EMAIL_MESSAGE, isHuEmail } from '../../utils/schoolEmail.js'

// Formulieren die zowel op Instellingen (student) als op Mijn account (admin-portaal) staan (story 5).

/**
 * Gebruikersnaam, e-mailadres en (optioneel) vaardigheden aanpassen.
 * Na het opslaan werkt useAuth() de gebruiker bij, dus "Mijn account" en de navigatiebalk tonen het meteen.
 * @param {{ withSkills?: boolean, onSaved?: () => void }} props
 */
export function ProfileForm({ withSkills = false, onSaved }) {
  const { user, setUser } = useAuth()
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [skills, setSkills] = useState(user.skills ?? {})
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    // Eerst zelf controleren (story 5: ongeldige invoer vóór het opslaan melden).
    const found = {}
    if (username.trim().length < 2 || username.trim().length > 20) found.username = 'Kies een naam van 2 tot 20 tekens.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = 'Vul een geldig e-mailadres in.'
    // Story 14: een nieuw adres moet een HU-adres zijn. Het huidige adres mag blijven (bijv. de seed-beheerder).
    else if (email.trim().toLowerCase() !== user.email && !isHuEmail(email)) found.email = HU_EMAIL_MESSAGE
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      const body = { username, email, ...(withSkills ? { skills } : {}) }
      const data = await api('/me', { method: 'PATCH', body })
      setUser(data.user)
      onSaved?.()
    } catch (apiError) {
      const field = apiError.code?.startsWith('USERNAME') ? 'username' : apiError.code?.startsWith('EMAIL') ? 'email' : 'general'
      setErrors({ [field]: apiError.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="ui-form" onSubmit={submit} noValidate>
      <TextField label="Gebruikersnaam" autoComplete="username" maxLength={20} value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
      <TextField label="E-mailadres" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      {withSkills && (
        <fieldset className="ui-fieldset" id="vaardigheden">
          <legend className="ui-label">Jouw vaardigheden (0–5)</legend>
          <SkillSliders value={skills} onChange={setSkills} />
        </fieldset>
      )}
      <Notice>{errors.general}</Notice>
      <button type="submit" className="ui-btn ui-btn--primary ui-submit" disabled={busy}>
        {busy ? 'Opslaan…' : 'Opslaan'}
      </button>
    </form>
  )
}

/** Wachtwoord wijzigen: eerst het huidige wachtwoord, dan het nieuwe (story 5). */
export function PasswordForm({ onSaved }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError(null)
    if (!current) return setError('Vul je huidige wachtwoord in.')
    if (!isStrongPassword(next)) return setError('Je nieuwe wachtwoord voldoet nog niet aan alle eisen.')
    setBusy(true)
    try {
      await api('/me/password', { method: 'POST', body: { currentPassword: current, newPassword: next } })
      setCurrent('')
      setNext('')
      onSaved?.()
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="ui-form" onSubmit={submit} noValidate>
      <PasswordField label="Huidig wachtwoord" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <PasswordField label="Nieuw wachtwoord" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      <PasswordChecklist password={next} />
      <Notice>{error}</Notice>
      <button type="submit" className="ui-btn ui-submit" disabled={busy}>
        {busy ? 'Opslaan…' : 'Wachtwoord wijzigen'}
      </button>
    </form>
  )
}
