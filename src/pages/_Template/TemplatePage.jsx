import QuizHeader from '../../components/QuizHeader.jsx'
import './TemplatePage.css'

/**
 * SJABLOON voor een nieuwe pagina. Bekijk hem op http://localhost:5173/template
 *
 * Zo maak je een nieuwe pagina:
 * 1. Kopieer de map src/pages/_Template naar src/pages/<JouwPagina>.
 * 2. Hernoem TemplatePage.jsx/.css en de functienaam hieronder (bijv. ProfielPage).
 * 3. Vervang overal "template-page" door je eigen naam (bijv. "profiel-page"),
 *    zodat je CSS niet botst met die van andere pagina's.
 * 4. Voeg een route toe in src/App.jsx:
 *      <Route path="/profiel" element={<ProfielPage />} />
 *
 * Wat je NIET hoeft te doen: de achtergrond, kleuren of het lettertype instellen.
 * Die komen uit src/index.css en gelden al voor elke pagina.
 */
export default function TemplatePage() {
  return (
    <div className="page template-page">
      {/* Navigatiebalk. Tijdens een spel geef je de spelcode mee: <QuizHeader code={code} /> */}
      <QuizHeader />

      <main className="page__main">
        {/* ↓ Vanaf hier jouw eigen inhoud. ↓ */}
        <h1 className="template-page__title">Paginatitel</h1>
        <p>Hier komt de inhoud van je pagina.</p>
      </main>
    </div>
  )
}
