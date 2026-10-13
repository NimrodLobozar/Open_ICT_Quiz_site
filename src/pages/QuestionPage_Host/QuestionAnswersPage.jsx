import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCountdown } from "../../hooks/useCountdown.js";
import { demoIndexFromSearch, getDemoQuestion } from "./demoQuestion.js";
import HostQuestionLayout from "./HostQuestionLayout.jsx";

// Elk antwoord heeft een eigen kleur én vorm. Alleen kleur is niet genoeg:
// kleurenblinde spelers herkennen hun knop dan aan de vorm (dezelfde volgorde als op de telefoon).
const OPTION_STYLES = [
  { name: "driehoek", shape: <polygon points="12,3 22,21 2,21" /> },
  { name: "ruit", shape: <polygon points="12,2 22,12 12,22 2,12" /> },
  { name: "cirkel", shape: <circle cx="12" cy="12" r="10" /> },
  { name: "vierkant", shape: <rect x="3" y="3" width="18" height="18" rx="2" /> },
];

// Omtrek van de timerring (r = 20): 2 × π × 20.
const RING_LENGTH = 2 * Math.PI * 20;

/**
 * Host, fase QUESTION_ACTIVE: vraag + antwoorden, timer en hoeveel spelers al geantwoord hebben.
 * @param {{ code: string, question: import("./QuestionPreviewPage.jsx").QuestionShow,
 *   answeredCount: number, playerCount: number, onStopTime?: () => void, onNext?: () => void }} props
 *   question = de payload van question:show, answeredCount/playerCount komen uit question:progress.
 */
export function HostQuestionAnswers({
  code,
  question,
  answeredCount,
  playerCount,
  onStopTime,
  onNext,
}) {
  const limitMs = question.timeLimitSec * 1000;
  const msLeft = useCountdown(question.startsAt + limitMs);
  const secondsLeft = Math.ceil(msLeft / 1000);
  const timeUp = msLeft === 0;

  return (
    <HostQuestionLayout
      code={code}
      index={question.index}
      total={question.total}
      variant="answers"
      aside={
        <div className="host-question__status">
          <div className="host-question__answered">
            <span className="host-question__answered-count">
              {answeredCount}
              <span>/{playerCount}</span>
            </span>
            <span className="host-question__answered-label">antwoorden</span>
          </div>
          <div className="host-question__timer">
            <svg aria-hidden="true" viewBox="0 0 48 48">
              <circle className="host-question__timer-track" cx="24" cy="24" r="20" />
              <circle
                className="host-question__timer-left"
                cx="24"
                cy="24"
                r="20"
                strokeDasharray={RING_LENGTH}
                // Hoe meer tijd voorbij is, hoe meer van de ring we "wegschuiven".
                strokeDashoffset={RING_LENGTH * (1 - msLeft / limitMs)}
              />
            </svg>
            <span
              role="timer"
              aria-label={timeUp ? "Tijd is op" : `Nog ${secondsLeft} seconden`}
            >
              {secondsLeft}
            </span>
          </div>
        </div>
      }
      actions={
        <>
          {onStopTime && (
            <button
              type="button"
              className="host-question__button"
              onClick={onStopTime}
              disabled={timeUp}
            >
              Tijd stoppen
            </button>
          )}
          {onNext && (
            <button
              type="button"
              className="host-question__button host-question__button--primary"
              onClick={onNext}
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              Volgende
            </button>
          )}
        </>
      }
    >
      <h1 className="host-question__text">{question.text}</h1>
      <ol className="host-question__options" aria-label="Antwoorden">
        {question.options.map((option, i) => {
          const style = OPTION_STYLES[i % OPTION_STYLES.length];
          return (
            <li
              key={option.id}
              className={`host-question__option host-question__option--${style.name}`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                {style.shape}
              </svg>
              <span>{option.text}</span>
            </li>
          );
        })}
      </ol>
    </HostQuestionLayout>
  );
}

// Demo op /question-answers?vraag=3 met nepdata: 12 nepspelers die één voor één antwoorden.
const DEMO_PLAYER_COUNT = 12;

export default function QuestionAnswersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const index = demoIndexFromSearch(searchParams);
  const [startsAt] = useState(() => Date.now());
  // null = de tijd loopt nog. Anders: na zoveel seconden is de vraag gestopt.
  const [stoppedAfterSec, setStoppedAfterSec] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  const question = getDemoQuestion(index, { startsAt, previewSeconds: 0 });
  // Tijd stoppen = de tijdslimiet inkorten tot nu. In het echt doet de server dit en stuurt question:end.
  const shownQuestion =
    stoppedAfterSec == null
      ? question
      : { ...question, timeLimitSec: stoppedAfterSec };

  function stopTime() {
    setStoppedAfterSec((current) => current ?? (Date.now() - startsAt) / 1000);
  }

  // Elke ~1,5 seconde antwoordt er een nepspeler, tot iedereen geantwoord heeft of de tijd stopt.
  useEffect(() => {
    if (stoppedAfterSec != null) return;
    const endsAt = startsAt + question.timeLimitSec * 1000;
    const timer = setInterval(() => {
      if (Date.now() >= endsAt) return clearInterval(timer);
      setAnsweredCount((count) => Math.min(DEMO_PLAYER_COUNT, count + 1));
    }, 1500);
    return () => clearInterval(timer);
  }, [stoppedAfterSec, startsAt, question.timeLimitSec]);

  // Heeft iedereen geantwoord, dan stopt de vraag vanzelf (projectplan 8.3).
  useEffect(() => {
    if (answeredCount === DEMO_PLAYER_COUNT) stopTime();
  }, [answeredCount]);

  function next() {
    const isLast = index + 1 >= question.total;
    // TODO(team, fase 5): eerst de tussenstand. Die is er nog niet, dus meteen de volgende vraag.
    navigate(isLast ? "/end" : `/question?vraag=${index + 2}`);
  }

  return (
    <HostQuestionAnswers
      code="482913"
      question={shownQuestion}
      answeredCount={answeredCount}
      playerCount={DEMO_PLAYER_COUNT}
      onStopTime={stopTime}
      onNext={next}
    />
  );
}
