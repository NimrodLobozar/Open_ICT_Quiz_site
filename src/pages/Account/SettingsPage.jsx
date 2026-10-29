import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Notice } from '../../components/AccountUi.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import { PasswordForm, ProfileForm } from './AccountForms.jsx'
import DeleteAccount from './DeleteAccount.jsx'
import './Account.css'

/**
 * /account/instellingen (story 5 en 6), design "5 · Accountinstellingen".
 * Profiel en vaardigheden, wachtwoord wijzigen, en account verwijderen.
 */
export default function SettingsPage() {
  const [saved, setSaved] = useState(null)
  const showSaved = (text) => {
    setSaved(text)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page settings-page">
      <QuizHeader />
      <main className="page__main settings-page__main">
        <Link to="/account" className="ui-link settings-page__back">
          ← Terug naar mijn account
        </Link>
        <h1 className="ui-title">INSTELLINGEN</h1>
        <Notice type="success">{saved}</Notice>

        <section aria-labelledby="profile-title" className="ui-card settings-page__section">
          <h2 id="profile-title" className="ui-section-title">
            Profiel
          </h2>
          <ProfileForm withSkills onSaved={() => showSaved('Je wijzigingen zijn opgeslagen.')} />
        </section>

        <section aria-labelledby="password-title" className="ui-card settings-page__section">
          <h2 id="password-title" className="ui-section-title">
            Wachtwoord wijzigen
          </h2>
          <PasswordForm onSaved={() => showSaved('Je wachtwoord is gewijzigd. Op andere apparaten ben je uitgelogd.')} />
        </section>

        <DeleteAccount />
      </main>
    </div>
  )
}
