import { Link } from 'react-router-dom'
import QuizHeader from '../../components/QuizHeader.jsx'
import './AuthPage.css'

/**
 * /privacy: de privacyregels waar je mee akkoord gaat bij het maken van een account (story 1).
 * TODO(team): laat deze tekst controleren door de docent of de privacyfunctionaris van de HU.
 */
export default function PrivacyPage() {
  return (
    <div className="page auth-page">
      <QuizHeader />
      <main className="page__main privacy-page__main">
        <article className="ui-card privacy-page">
          <h1 className="ui-title">PRIVACYREGELS</h1>
          <h2 className="ui-section-title">Wat we bewaren</h2>
          <ul>
            <li>Je gebruikersnaam en e-mailadres.</li>
            <li>Je wachtwoord, alleen versleuteld (niemand kan het teruglezen, ook wij niet).</li>
            <li>De vaardigheden die je zelf invult.</li>
            <li>Je uitslagen: per gespeelde quiz je plaats, score en aantal goede antwoorden.</li>
            <li>Op welk soort apparaat je bent ingelogd (bijv. &quot;Telefoon · Safari&quot;), niet je IP-adres.</li>
          </ul>
          <h2 className="ui-section-title">Waarvoor</h2>
          <p>Alleen om je je eigen scores en voortgang te laten zien, en zodat je docent de uitslagen van een ronde kan terugkijken.</p>
          <h2 className="ui-section-title">Wie het ziet</h2>
          <p>
            Jij ziet je eigen gegevens. Andere spelers zien alleen je gebruikersnaam en score in de eindstand van een ronde.
            Docenten zien de uitslagen van hun eigen quizzen; beheerders kunnen accounts beheren.
          </p>
          <h2 className="ui-section-title">Verwijderen</h2>
          <p>
            Je kunt je account altijd zelf verwijderen via Instellingen. Je profiel wordt dan gewist. In oude eindstanden blijft
            alleen een anonieme regel (&quot;Verwijderde speler&quot;) over, zodat de plaatsen van de anderen kloppen.
          </p>
          <p>
            Meedoen aan een quiz kan ook zonder account. <Link to="/registreren" className="ui-link">Terug naar account maken</Link>
          </p>
        </article>
      </main>
    </div>
  )
}
