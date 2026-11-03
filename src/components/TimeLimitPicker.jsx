import "./TimeLimitPicker.css";

// De keuzes voor de host. null = de tijden die al bij de vragen in de quiz staan.
// Dezelfde getallen als TIME_OPTIONS in backend/quiz/quizRules.js: andere waarden weigert de server.
const CHOICES = [
  { seconds: null, label: "Zoals in de quiz" },
  { seconds: 10, label: "10 sec" },
  { seconds: 20, label: "20 sec" },
  { seconds: 30, label: "30 sec" },
  { seconds: 60, label: "60 sec" },
];

/**
 * Knoppen om in de lobby de tijd per vraag te kiezen.
 * Net als LockButton onthoudt dit onderdeel zelf niets: `value` komt van de server (lobby:update),
 * zodat de knoppen na verversen of in een tweede tabblad hetzelfde laten zien als de server.
 * @param {{ value: number | null, onChange: (seconds: number | null) => void, disabled?: boolean }} props
 */
export default function TimeLimitPicker({ value, onChange, disabled = false }) {
  return (
    <div
      className="time-picker"
      role="group"
      aria-labelledby="time-picker-label"
    >
      <p id="time-picker-label" className="time-picker__label">
        Tijd per vraag
      </p>
      <div className="time-picker__choices">
        {CHOICES.map((choice) => {
          const selected = choice.seconds === value;
          return (
            <button
              key={choice.label}
              type="button"
              className={
                selected
                  ? "time-picker__choice time-picker__choice--selected"
                  : "time-picker__choice"
              }
              // aria-pressed vertelt een schermlezer welke knop nu "aan" staat.
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(choice.seconds)}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
