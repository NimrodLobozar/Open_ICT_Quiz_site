import { useNavigate, useSearchParams } from "react-router-dom";
import AnswerShape, { answerColorClass } from "../../components/AnswerShape.jsx";
import {
  DEMO_CODE,
  demoIndexFromSearch,
  getDemoQuestion,
  getDemoRound,
} from "../../data/demoGame.js";
import { formatScore } from "../../utils/formatScore.js";
import HostQuestionLayout from "./HostQuestionLayout.jsx";

// Hoeveel spelers de tussenstand op het grote scherm laat zien (projectplan: top 5–10).
const TOP_COUNT = 5;

/**
 * Host, fase LEADERBOARD: links hoe de vraag afliep, rechts de tussenstand.
 * @param {{ code: string, question: import("./QuestionPreviewPage.jsx").QuestionShow,
 *   correctOptionId: number, answerCounts: Record<number, number>, playerCount: number,
 *   ranking: Array<{ id: number, nickname: string, score: number, rank: number, pointsGained: number }>,
 *   onNext?: () => void }} props
 *   correctOptionId en answerCounts komen uit question:end, ranking uit leaderboard:show (via getRanking).
 */
export function HostLeaderboard({
  code,
  question,
  correctOptionId,
  answerCounts,
  playerCount,
  ranking,
  onNext,
}) {
  const correctCount = answerCounts[correctOptionId] ?? 0;
  const isLast = question.index + 1 >= question.total;

  return (
    <HostQuestionLayout
      code={code}
      variant="leaderboard"
      actions={
        onNext && (
          <button
            type="button"
            className="host-question__button host-question__button--primary host-question__button--large"
            onClick={onNext}
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            {isLast ? "Naar de eindstand" : "Volgende vraag"}
          </button>
        )
      }
    >
      <div className="host-question__leaderboard">
        <section
          className="host-question__outcome"
          aria-labelledby="host-outcome-title"
        >
          <h2 id="host-outcome-title" className="host-question__outcome-title">
            Vraag {question.index + 1} · het goede antwoord
          </h2>
          <p className="host-question__outcome-summary">
            <strong>
              {correctCount} van {playerCount}
            </strong>{" "}
            {playerCount === 1 ? "speler had" : "spelers hadden"} het goed.
          </p>
          <ol className="host-question__counts">
            {question.options.map((option, i) => {
              const isCorrect = option.id === correctOptionId;
              const count = answerCounts[option.id] ?? 0;
              return (
                <li
                  key={option.id}
                  className={`host-question__count ${answerColorClass(i)} ${
                    isCorrect ? "is-correct" : ""
                  }`}
                >
                  <AnswerShape index={i} />
                  <span className="host-question__count-text">
                    {option.text}
                    {/* Niet alleen een vinkje: ook tekst, voor schermlezers. */}
                    {isCorrect && (
                      <span className="host-question__sr-only">
                        {" "}
                        (goed antwoord)
                      </span>
                    )}
                  </span>
                  {isCorrect && (
                    <svg
                      className="host-question__check"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                  )}
                  <span>
                    {count}
                    <span className="host-question__sr-only">
                      {count === 1 ? " speler" : " spelers"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section
          className="host-question__standings"
          aria-labelledby="host-standings-title"
        >
          <h1
            id="host-standings-title"
            className="host-question__standings-title"
          >
            TUSSENSTAND
          </h1>
          <ol className="host-question__ranking">
            {ranking.slice(0, TOP_COUNT).map((player, i) => (
              <li
                key={player.id}
                className={`host-question__rank-row ${i === 0 ? "is-first" : ""}`}
              >
                <div className="host-question__rank-bar">
                  <span className="host-question__rank">{player.rank}</span>
                  <span className="host-question__rank-name">
                    {player.nickname}
                  </span>
                  {/* Alleen tonen als er punten bij kwamen: "+0" zegt niets. */}
                  <span className="host-question__rank-gain">
                    {player.pointsGained > 0 &&
                      `+${formatScore(player.pointsGained)}`}
                  </span>
                  <span className="host-question__rank-score">
                    {formatScore(player.score)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </HostQuestionLayout>
  );
}

// Demo op /leaderboard?vraag=3 met nepdata. "Volgende vraag" gaat naar de volgende demo-vraag.
export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const index = demoIndexFromSearch(searchParams);
  const question = getDemoQuestion(index, { startsAt: 0, previewSeconds: 0 });
  const { correctOptionId, answerCounts, ranking } = getDemoRound(index);
  const isLast = index + 1 >= question.total;

  return (
    <HostLeaderboard
      code={DEMO_CODE}
      question={question}
      correctOptionId={correctOptionId}
      answerCounts={answerCounts}
      playerCount={ranking.length}
      ranking={ranking}
      onNext={() => navigate(isLast ? "/end" : `/question?vraag=${index + 2}`)}
    />
  );
}
