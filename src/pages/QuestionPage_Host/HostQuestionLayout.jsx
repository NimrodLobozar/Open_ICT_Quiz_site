import { Link } from "react-router-dom";
import "./QuestionPage.css";

// De vier cirkels op de achtergrond (straal in procenten van het vierkant), net als op het eindscherm.
const RINGS = [48, 38, 28, 18];

/**
 * Wat beide vraagschermen van de host delen: achtergrond, bovenbalk en "Vraag 3 van 8".
 * @param {{ code: string, index: number, total: number, aside?: React.ReactNode,
 *   actions?: React.ReactNode, variant: "preview" | "answers", children: React.ReactNode }} props
 *   index telt vanaf 0, net als questionIndex in de socket-events. Op het scherm tellen we vanaf 1.
 */
export default function HostQuestionLayout({
  code,
  index,
  total,
  aside,
  actions,
  variant,
  children,
}) {
  return (
    <div className="host-question">
      <svg
        className="host-question__rings"
        aria-hidden="true"
        viewBox="0 0 100 100"
      >
        {RINGS.map((r) => (
          <circle key={r} cx="50" cy="50" r={r} />
        ))}
      </svg>

      <nav className="host-question__nav" aria-label="Hoofdmenu">
        <Link to="/" className="host-question__logo">
          OPEN ICT QUIZ
        </Link>
        {/* TODO(team, L1): Profiel en Uitloggen toevoegen zodra er login is. */}
        <span className="host-question__code">
          CODE <strong>{code}</strong>
        </span>
      </nav>

      <main className={`host-question__main host-question__main--${variant}`}>
        <div className="host-question__top">
          <QuestionProgress index={index} total={total} />
          {aside}
        </div>
        {children}
        {actions && <div className="host-question__actions">{actions}</div>}
      </main>
    </div>
  );
}

/** "Vraag 3 van 8" met een streepje per vraag. Gedaan en huidig zijn donker, de rest licht. */
function QuestionProgress({ index, total }) {
  return (
    <div className="host-question__progress">
      <span className="host-question__progress-label">
        Vraag {index + 1} van {total}
      </span>
      {/* aria-hidden: de tekst hierboven zegt al hetzelfde, de streepjes zijn alleen voor het oog. */}
      <div className="host-question__progress-bars" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i <= index ? "is-done" : undefined} />
        ))}
      </div>
    </div>
  );
}
