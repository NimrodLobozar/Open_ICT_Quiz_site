import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AnswerShape, {
  answerColorClass,
  getAnswerStyle,
} from "../../components/AnswerShape.jsx";
import QuestionProgress from "../../components/QuestionProgress.jsx";
import QuizHeader from "../../components/QuizHeader.jsx";
import TimerRing from "../../components/TimerRing.jsx";
import {
  DEMO_CODE,
  DEMO_PLAYER_ID,
  demoIndexFromSearch,
  demoPoints,
  getDemoQuestion,
  getDemoScoreBefore,
  isDemoOptionCorrect,
} from "../../data/demoGame.js";
import { gameResults } from "../../data/dummyDatabase.js";
import { useCountdown } from "../../hooks/useCountdown.js";
import { formatScore } from "../../utils/formatScore.js";
import "./PlayerQuestion.css";

/**
 * Speler, fases QUESTION_PREVIEW en QUESTION_ACTIVE: de vraag met vier antwoordknoppen.
 * De vraagtekst staat er ook, zodat je niet per se naar het bord hoeft te kijken (projectplan 3.2).
 * @param {{ code: string, question: import("../QuestionPage_Host/QuestionPreviewPage.jsx").QuestionShow,
 *   nickname: string, score: number, chosenAnswer: number | number[] | null,
 *   onAnswer: (choice: number | number[]) => void, error?: string | null }} props
 *   question = de payload van question:show. chosenAnswer = wat je al verstuurd hebt (null = nog niets):
 *   één optionId, of een lijst bij een vraag met meerdere goede antwoorden (question.multiple).
 *   onAnswer stuurt player:answer. Of het goed was, hoor je pas bij de uitslag.
 *   error = melding als je antwoord niet aankwam (bijv. te laat).
 */
export function PlayerQuestion({
  code,
  question,
  nickname,
  score,
  chosenAnswer,
  onAnswer,
  error = null,
}) {
  const limitMs = question.timeLimitSec * 1000;
  const paused = Boolean(question.paused);
  // Eerst leestijd (tot startsAt), daarna loopt de tijd voor het antwoorden.
  const previewMsLeft = useCountdown(question.startsAt);
  // Heeft de host de tijd gestopt, dan staat de klok stil op wat er nog over was.
  const countdown = useCountdown(paused ? null : question.startsAt + limitMs);
  const msLeft = paused ? question.pausedMsLeft : countdown;
  const reading = !paused && previewMsLeft > 0;
  const timeUp = !paused && msLeft === 0;
  const answered = chosenAnswer != null;
  const multiple = Boolean(question.multiple);
  // Meerdere goede antwoorden: eerst aanvinken (alleen op dit scherm), dan zelf versturen.
  const [ticked, setTicked] = useState([]);
  const sentIds = answered ? [chosenAnswer].flat() : [];
  const isChosen = (id) => (answered ? sentIds.includes(id) : ticked.includes(id));

  function choose(id) {
    if (!multiple) return onAnswer(id);
    setTicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  return (
    <div className="page player-question">
      <QuizHeader code={code} />

      <main className="page__main player-question__main">
        <div className="player-question__top">
          <QuestionProgress index={question.index} total={question.total} />
          {/* Tijdens de leestijd staat de ring nog vol. */}
          <TimerRing msLeft={reading ? limitMs : msLeft} limitMs={limitMs} />
        </div>

        <h1 className="player-question__text">{question.text}</h1>

        {question.multiplier != null && (
          <p className="player-question__multiplier" role="note">
            Deze vraag telt <strong>x{question.multiplier}</strong> mee.
          </p>
        )}

        {multiple && !reading && (
          <p className="player-question__multiple" role="note">
            Meerdere antwoorden zijn goed. Kies ze allemaal en druk op Versturen.
          </p>
        )}

        {reading ? (
          <p className="player-question__reading" role="status">
            Lees de vraag. De antwoorden komen over{" "}
            <strong>{Math.ceil(previewMsLeft / 1000)}</strong> s.
          </p>
        ) : (
          <div className="player-question__options">
            {question.options.map((option, i) => {
              const chosen = isChosen(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`player-question__option ${answerColorClass(i)} ${
                    chosen ? "is-chosen" : ""
                  }`}
                  // Na je keuze kun je niet meer wisselen: de server telt alleen je eerste antwoord.
                  disabled={answered || timeUp}
                  aria-pressed={chosen}
                  aria-label={`Antwoord ${getAnswerStyle(i).name}: ${option.text}`}
                  onClick={() => choose(option.id)}
                >
                  <AnswerShape index={i} />
                  <span>{option.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {multiple && !reading && !answered && (
          <button
            type="button"
            className="player-question__send"
            disabled={ticked.length === 0 || timeUp}
            onClick={() => onAnswer(ticked)}
          >
            Versturen{ticked.length > 0 ? ` (${ticked.length})` : ""}
          </button>
        )}

        {/* role="status": een schermlezer leest dit voor zodra het verschijnt. */}
        <p className="player-question__feedback" role="status">
          {error ??
            (answered
              ? paused
                ? "Antwoord verstuurd! De host bespreekt de vraag…"
                : "Antwoord verstuurd! Wachten op de anderen…"
              : paused
                ? "De tijd is gestopt. Je kunt nog antwoorden."
                : timeUp && !reading
                  ? "De tijd is op."
                  : "")}
        </p>

        <div className="player-question__footer">
          <span>
            <strong>{nickname}</strong> · {formatScore(score)} punten
          </span>
          <span>Sneller antwoorden = meer punten</span>
        </div>
      </main>
    </div>
  );
}

// Demo op /player-question?vraag=3 met nepdata. Jij bent Emma.
// Na je antwoord (of als de tijd op is) gaat de demo door naar je uitslag.
const DEMO_PREVIEW_SECONDS = 3;

export default function PlayerQuestionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const index = demoIndexFromSearch(searchParams);
  const [startsAt] = useState(() => Date.now() + DEMO_PREVIEW_SECONDS * 1000);
  // null = nog niet geantwoord. Anders: { optionId, points }.
  const [myAnswer, setMyAnswer] = useState(null);
  const question = getDemoQuestion(index, {
    startsAt,
    previewSeconds: DEMO_PREVIEW_SECONDS,
  });
  const me = gameResults.find((player) => player.id === DEMO_PLAYER_ID);

  function answer(optionId) {
    // In het echt meet de server de tijd en rekent hij de punten uit. De demo doet alsof.
    const points = demoPoints(
      isDemoOptionCorrect(optionId),
      Date.now() - startsAt,
      question.timeLimitSec,
    );
    setMyAnswer({ optionId, points });
  }

  // Door naar de uitslag: kort na je antwoord, of als de tijd op is (dan met 0 punten).
  useEffect(() => {
    const resultUrl = `/player-result?vraag=${index + 1}`;
    const timer = myAnswer
      ? setTimeout(
          () =>
            navigate(
              `${resultUrl}&antwoord=${myAnswer.optionId}&punten=${myAnswer.points}`,
            ),
          1500,
        )
      : setTimeout(
          () => navigate(`${resultUrl}&antwoord=geen`),
          startsAt + question.timeLimitSec * 1000 - Date.now() + 1500,
        );
    return () => clearTimeout(timer);
  }, [myAnswer, startsAt, question.timeLimitSec, index, navigate]);

  return (
    <PlayerQuestion
      code={DEMO_CODE}
      question={question}
      nickname={me.nickname}
      score={getDemoScoreBefore(DEMO_PLAYER_ID, index)}
      chosenAnswer={myAnswer?.optionId ?? null}
      onAnswer={answer}
    />
  );
}
