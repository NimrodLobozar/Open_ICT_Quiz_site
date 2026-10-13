import { Link } from "react-router-dom";
import QuestionProgress from "../../components/QuestionProgress.jsx";
import "./QuestionPage.css";

// De vier cirkels op de achtergrond (straal in procenten van het vierkant), net als op het eindscherm.
const RINGS = [48, 38, 28, 18];

/**
 * Wat de vraagschermen van de host delen: achtergrond, bovenbalk en "Vraag 3 van 8".
 * @param {{ code: string, index?: number, total?: number, aside?: React.ReactNode,
 *   actions?: React.ReactNode, variant: "preview" | "answers" | "leaderboard", children: React.ReactNode }} props
 *   index telt vanaf 0, net als questionIndex in de socket-events. Zonder index geen "Vraag 3 van 8".
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
        {index != null && (
          <div className="host-question__top">
            <QuestionProgress index={index} total={total} size="large" />
            {aside}
          </div>
        )}
        {children}
        {actions && <div className="host-question__actions">{actions}</div>}
      </main>
    </div>
  );
}
