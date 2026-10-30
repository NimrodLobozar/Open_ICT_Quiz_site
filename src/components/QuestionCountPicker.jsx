import { QUESTION_COUNT_OPTIONS } from "../utils/randomQuiz.js";
import "./QuestionCountPicker.css";

/**
 * Knoppen om in de lobby van een willekeurige quiz het aantal vragen te kiezen.
 * Net als LockButton onthoudt dit onderdeel zelf niets: `value` komt van de server (lobby:update),
 * zodat de knoppen na verversen of in een tweede tabblad hetzelfde laten zien als de server.
 * @param {{ value: number, onChange: (count: number) => void, disabled?: boolean }} props
 */
export default function QuestionCountPicker({
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div
      className="count-picker"
      role="group"
      aria-labelledby="count-picker-label"
    >
      <p id="count-picker-label" className="count-picker__label">
        Aantal vragen
      </p>
      <div className="count-picker__choices">
        {QUESTION_COUNT_OPTIONS.map((count) => {
          const selected = count === value;
          return (
            <button
              key={count}
              type="button"
              className={
                selected
                  ? "count-picker__choice count-picker__choice--selected"
                  : "count-picker__choice"
              }
              // aria-pressed vertelt een schermlezer welke knop nu "aan" staat.
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(count)}
            >
              {count}
            </button>
          );
        })}
      </div>
    </div>
  );
}
