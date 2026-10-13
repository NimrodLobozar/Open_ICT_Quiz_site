import { useSearchParams } from "react-router-dom";
import QuizHeader from "../../components/QuizHeader.jsx";
import Scoreboard from "../../components/Scoreboard.jsx";
import {
  DEMO_CODE,
  DEMO_PLAYER_ID,
  demoIndexFromSearch,
  getDemoQuestion,
  getDemoRound,
  isDemoOptionCorrect,
} from "../../data/demoGame.js";
import { formatScore } from "../../utils/formatScore.js";
import { buildPlayerResult } from "../../utils/playerResult.js";
import "./PlayerQuestion.css";

/**
 * Speler, na een vraag (QUESTION_RESULT / LEADERBOARD): goed of fout, je plek en wie er om je heen staan.
 * @param {{ code: string, question: import("../QuestionPage_Host/QuestionPreviewPage.jsx").QuestionShow,
 *   correctOptionId: number, ranking: Array<{ id: number, nickname: string, score: number, rank: number,
 *   isVerified: boolean, pointsGained: number }>,
 *   myResult: { answered: boolean, correct: boolean, pointsGained: number }, myPlayerId: number }} props
 *   correctOptionId en ranking komen uit question:end (ranking via getRanking op de server),
 *   myResult uit question:my-result. Hier wordt niets berekend dat niet uit ranking te halen is.
 */
export function PlayerQuestionResult({
  code,
  question,
  correctOptionId,
  ranking,
  myResult,
  myPlayerId,
}) {
  // Zelfde functie als het eindscherm: plek, "nog X punten tot de Ye plek".
  const standing = buildPlayerResult(ranking, myPlayerId, question.total);
  const correctOption = question.options.find(
    (option) => option.id === correctOptionId,
  );
  const isLast = question.index + 1 >= question.total;

  return (
    <div className="player-question">
      <QuizHeader code={code} />

      <main className="player-question__main player-question__main--result">
        <Verdict myResult={myResult} />
        {correctOption && (
          <p className="player-question__answer-was">
            Het goede antwoord was <strong>{correctOption.text}</strong>.
          </p>
        )}

        {/* Eén kop, zodat een schermlezer de hele zin voorleest: "Je staat nu 8e van 12 spelers". */}
        <h1 className="player-question__place">
          <span>Je staat nu</span>
          <span className="player-question__place-rank">{standing.rank}e</span>
          <span>
            van {standing.playerCount}{" "}
            {standing.playerCount === 1 ? "speler" : "spelers"}
          </span>
        </h1>
        <p className="player-question__to-next">
          {standing.nextRank == null
            ? "Je staat bovenaan!"
            : `Nog ${formatScore(standing.pointsToNext)} punten tot de ${standing.nextRank}e plek`}
        </p>

        <Scoreboard
          rows={getNeighbours(ranking, myPlayerId)}
          myPlayerId={myPlayerId}
          label="Spelers rond jouw plek"
        />

        <p className="player-question__next">
          {isLast
            ? "Kijk naar het grote scherm voor de eindstand."
            : `Kijk naar het grote scherm voor vraag ${question.index + 2}.`}
        </p>
      </main>
    </div>
  );
}

/** Groen bij goed, rood bij fout, neutraal als je niet antwoordde. Altijd met tekst én icoon, niet alleen kleur. */
function Verdict({ myResult }) {
  const kind = !myResult.answered
    ? "none"
    : myResult.correct
      ? "correct"
      : "wrong";
  const text = {
    correct: `GOED! +${formatScore(myResult.pointsGained)}`,
    wrong: "FOUT",
    none: "GEEN ANTWOORD",
  }[kind];

  return (
    <div
      className={`player-question__verdict player-question__verdict--${kind}`}
      role="status"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        {kind === "correct" && <path d="M4 12l5 5L20 6" />}
        {kind === "wrong" && <path d="M6 6l12 12M18 6L6 18" />}
        {kind === "none" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        )}
      </svg>
      <span>{text}</span>
    </div>
  );
}

/**
 * Jij met twee spelers boven je en één onder je (zoals in het design).
 * Sta je bovenaan of onderaan, dan schuift het venster op, zodat je toch 4 rijen ziet.
 */
function getNeighbours(ranking, playerId) {
  const SIZE = 4;
  const myIndex = ranking.findIndex((row) => row.id === playerId);
  const start = Math.max(0, Math.min(myIndex - 2, ranking.length - SIZE));
  return ranking.slice(start, start + SIZE);
}

// Demo op /player-result?vraag=3 met nepdata. Jij bent Emma.
// Kom je van /player-question, dan staat jouw antwoord in de adresbalk (&antwoord=11&punten=760).
// Zonder die parameters krijgt Emma haar vaste nep-antwoord.
export default function PlayerResultPage() {
  const [searchParams] = useSearchParams();
  const index = demoIndexFromSearch(searchParams);
  const question = getDemoQuestion(index, { startsAt: 0, previewSeconds: 0 });
  const { correctOptionId, ranking } = getDemoRound(index, {
    myAnswer: readMyAnswer(searchParams),
  });
  // De demo-ranking heeft per speler ook answered/correct. Bij de echte server komt dit los (question:my-result).
  const me = ranking.find((row) => row.id === DEMO_PLAYER_ID);

  return (
    <PlayerQuestionResult
      code={DEMO_CODE}
      question={question}
      correctOptionId={correctOptionId}
      ranking={ranking}
      myResult={me}
      myPlayerId={DEMO_PLAYER_ID}
    />
  );
}

function readMyAnswer(searchParams) {
  if (!searchParams.has("antwoord")) return undefined;
  const optionId = Number(searchParams.get("antwoord"));
  if (!Number.isInteger(optionId)) return { optionId: null, points: 0 };
  // Nooit zomaar geloven wat in de adresbalk staat: fout = 0, en nooit meer dan 1000.
  const points = Number(searchParams.get("punten"));
  const valid = isDemoOptionCorrect(optionId) && Number.isFinite(points);
  return {
    optionId,
    points: valid ? Math.min(1000, Math.max(0, Math.round(points))) : 0,
  };
}
