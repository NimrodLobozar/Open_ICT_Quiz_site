import { Link } from 'react-router-dom'
import ChoiceCard, { ChoiceGrid } from '../../components/ChoiceCard.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import './HostChoicePage.css'

/**
 * /host: wat wil je hosten? Zit tussen de startpagina (/) en het aanmaken van de game (/host/new).
 * - Willekeurig: mag iedereen, ook zonder account.
 * - Bestaande quiz: komt later. Docenten kunnen hun eigen quizzen nu al hosten via het beheerportaal.
 */
export default function HostChoicePage() {
  return (
    <div className="page host-choice-page">
      <QuizHeader />

      <main className="page__main host-choice-page__main">
        <h1 className="host-choice-page__title">Quiz hosten</h1>
        <p className="host-choice-page__intro">Welke quiz wil je hosten?</p>

        <ChoiceGrid>
          <ChoiceCard
            to="/host/new?random=1"
            primary
            title="Willekeurig"
            text="Vragen uit de vragenbank, passend bij de vaardigheden van de spelers."
          />
          <ChoiceCard
            title="Bestaande quiz"
            text="Kies een quiz die al gemaakt is."
            disabledReason="Binnenkort: gemaakte quizzen hosten komt eraan."
          />
        </ChoiceGrid>

        <Link to="/" className="host-choice-page__back">
          Terug naar de startpagina
        </Link>
      </main>
    </div>
  )
}
