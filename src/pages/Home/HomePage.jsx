import ChoiceCard, { ChoiceGrid } from '../../components/ChoiceCard.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import './HomePage.css'

/**
 * /: de startpagina. Twee keuzes: meedoen met een code, of zelf een quiz hosten.
 * Hosten mag iedereen, ook zonder account. Wat je host, kies je daarna op /host.
 */
export default function HomePage() {
  return (
    <div className="page home-page">
      <QuizHeader />

      <main className="page__main home-page__main">
        <h1 className="home-page__title">Open ICT Quiz</h1>
        <p className="home-page__intro">Wat wil je doen?</p>

        <ChoiceGrid>
          <ChoiceCard to="/join" primary title="Meedoen" text="Vul de code in die op het grote scherm staat." />
          <ChoiceCard to="/host" title="Quiz hosten" text="Start een quiz en laat anderen meedoen. Geen account nodig." />
        </ChoiceGrid>
      </main>
    </div>
  )
}
