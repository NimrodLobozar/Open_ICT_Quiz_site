import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AnswerShape, { answerColorClass } from "../../components/AnswerShape.jsx";
import TimerRing from "../../components/TimerRing.jsx";
import {
  DEMO_CODE,
  demoIndexFromSearch,
  getDemoQuestion,
} from "../../data/demoGame.js";
import { gameResults } from "../../data/dummyDatabase.js";
import { useCountdown } from "../../hooks/useCountdown.js";
import HostQuestionLayout from "./HostQuestionLayout.jsx";

/**
 * Host, fase QUESTION_ACTIVE: vraag + antwoorden, timer en hoeveel spelers al geantwoord hebben.
 * @param {{ code: string, question: import("./QuestionPreviewPage.jsx").QuestionShow,
 *   answeredCount: number, playerCount: number, onStopTime?: () => void, onNext?: () => void }} props
 *   question = de payload van question:show, answeredCount/playerCount komen uit question:progress.
 *   onStopTime = "Tijd stoppen" (host:pause): de klok staat stil, de vraag blijft staan om te bespreken.
 *   onNext = "Naar de tussenstand" (host:next): verschijnt zodra de tijd stilstaat.
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
  const paused = Boolean(question.paused);
  // Tijd gestopt: niet meer aftellen, maar de klok laten staan op wat er nog over was.
  const countdown = useCountdown(paused ? null : question.startsAt + limitMs);
  const msLeft = paused ? question.pausedMsLeft : countdown;
  const timeUp = !paused && msLeft === 0;

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
          <TimerRing
            msLeft={msLeft}
            limitMs={limitMs}
            className={`host-question__timer ${paused ? "is-paused" : ""}`}
          />
        </div>
      }
      actions={
        <>
          {paused && (
            <p className="host-question__paused" role="status">
              Tijd gestopt. Bespreek de vraag; spelers kunnen nog antwoorden.
            </p>
          )}
          {onStopTime && !paused && (
            <button
              type="button"
              className="host-question__button"
              onClick={onStopTime}
              disabled={timeUp}
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
                <path d="M8 5v14M16 5v14" />
              </svg>
              Tijd stoppen
            </button>
          )}
          {onNext && (paused || timeUp) && (
            <button
              type="button"
              className="host-question__button host-question__button--primary"
              onClick={onNext}
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              Naar de tussenstand
            </button>
          )}
        </>
      }
    >
      <h1 className="host-question__text">{question.text}</h1>
      {question.multiple && (
        <p className="host-question__multiple">Meerdere antwoorden zijn goed: kies ze allemaal.</p>
      )}
      <ol className="host-question__options" aria-label="Antwoorden">
        {question.options.map((option, i) => (
          <li
            key={option.id}
            className={`host-question__option ${answerColorClass(i)}`}
          >
            <AnswerShape index={i} />
            <span>{option.text}</span>
          </li>
        ))}
      </ol>
    </HostQuestionLayout>
  );
}

// Demo op /question-answers?vraag=3 met nepdata: de nepspelers antwoorden één voor één.
const DEMO_PLAYER_COUNT = gameResults.length;

export default function QuestionAnswersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const index = demoIndexFromSearch(searchParams);
  const [startsAt] = useState(() => Date.now());
  // null = de tijd loopt nog. Anders: na zoveel seconden is de tijd gestopt.
  const [stoppedAfterSec, setStoppedAfterSec] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  const question = getDemoQuestion(index, { startsAt, previewSeconds: 0 });
  // Tijd stoppen = de klok staat stil (paused). In het echt doet de server dit (host:pause).
  const shownQuestion =
    stoppedAfterSec == null
      ? question
      : {
          ...question,
          paused: true,
          pausedMsLeft: Math.max(0, (question.timeLimitSec - stoppedAfterSec) * 1000),
        };

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

  return (
    <HostQuestionAnswers
      code={DEMO_CODE}
      question={shownQuestion}
      answeredCount={answeredCount}
      playerCount={DEMO_PLAYER_COUNT}
      onStopTime={stopTime}
      onNext={() => navigate(`/leaderboard?vraag=${index + 1}`)}
    />
  );
}
