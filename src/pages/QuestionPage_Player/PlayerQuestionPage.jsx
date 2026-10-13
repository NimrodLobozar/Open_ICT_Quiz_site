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
 *   nickname: string, score: number, chosenOptionId: number | null, onAnswer: (optionId: number) => void }} props
 *   question = de payload van question:show. chosenOptionId = wat je al gekozen hebt (null = nog niets).
 *   onAnswer stuurt straks player:answer. Of het goed was, hoor je pas bij de uitslag.
 */
export function PlayerQuestion({
  code,
  question,
  nickname,
  score,
  chosenOptionId,
  onAnswer,
}) {
  const limitMs = question.timeLimitSec * 1000;
  // Eerst leestijd (tot startsAt), daarna loopt de tijd voor het antwoorden.
  const previewMsLeft = useCountdown(question.startsAt);
  const msLeft = useCountdown(question.startsAt + limitMs);
  const reading = previewMsLeft > 0;
  const timeUp = msLeft === 0;
  const answered = chosenOptionId != null;

  return (
    <div className="player-question">
      <QuizHeader code={code} />

      <main className="player-question__main">
        <div className="player-question__top">
          <QuestionProgress index={question.index} total={question.total} />
          {/* Tijdens de leestijd staat de ring nog vol. */}
          <TimerRing msLeft={reading ? limitMs : msLeft} limitMs={limitMs} />
        </div>

        <h1 className="player-question__text">{question.text}</h1>

        {reading ? (
          <p className="player-question__reading" role="status">
            Lees de vraag. De antwoorden komen over{" "}
            <strong>{Math.ceil(previewMsLeft / 1000)}</strong> s.
          </p>
        ) : (
          <div className="player-question__options">
            {question.options.map((option, i) => {
              const chosen = option.id === chosenOptionId;
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
                  onClick={() => onAnswer(option.id)}
                >
                  <AnswerShape index={i} />
                  <span>{option.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* role="status": een schermlezer leest dit voor zodra het verschijnt. */}
        <p className="player-question__feedback" role="status">
          {answered
            ? "Antwoord verstuurd! Wachten op de anderen…"
            : timeUp && !reading
              ? "De tijd is op."
              : ""}
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
      chosenOptionId={myAnswer?.optionId ?? null}
      onAnswer={answer}
    />
  );
}
