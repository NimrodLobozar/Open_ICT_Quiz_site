import './QuestionProgress.css'

/**
 * "Vraag 3 van 8" met een streepje per vraag. Gedaan en huidig zijn donker, de rest licht.
 * Host (groot scherm) en speler gebruiken hetzelfde component, alleen de maat verschilt.
 * @param {{ index: number, total: number, size?: 'large' | 'small' }} props
 *   index telt vanaf 0, net als questionIndex in de socket-events. Op het scherm tellen we vanaf 1.
 *   De kleuren (--quiz-*) komen van de pagina.
 */
export default function QuestionProgress({ index, total, size = 'small' }) {
  return (
    <div className={`question-progress question-progress--${size}`}>
      <span className="question-progress__label">
        Vraag {index + 1} van {total}
      </span>
      {/* aria-hidden: de tekst hierboven zegt al hetzelfde, de streepjes zijn alleen voor het oog. */}
      <div className="question-progress__bars" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i <= index ? 'is-done' : undefined} />
        ))}
      </div>
    </div>
  )
}
