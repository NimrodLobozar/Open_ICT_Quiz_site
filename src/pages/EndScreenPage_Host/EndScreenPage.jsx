import { Link } from "react-router-dom";
import Podium from "../../components/Podium.jsx";
import Scoreboard from "../../components/Scoreboard.jsx";
import { gameResults, gameSessions } from "../../data/dummyDatabase.js";
import { getRanking } from "../../utils/ranking.js";
import "./EndScreenPage.css";

// De vier cirkels op de achtergrond (straal in procenten van het vierkant).
const RINGS = [48, 38, 28, 18];

/**
 * Eindstand op het grote scherm van de host.
 * @param {{ code: string, ranking: Array<{ id: number, nickname: string, score: number, rank: number }>,
 *   onRestart?: () => void }} props
 *   ranking komt van de server (game:podium), al door getRanking() gehaald.
 *   Zonder onRestart linkt "Nog een ronde" naar de oude lobbypagina (voor de demo op /end).
 */
export function HostEndScreen({ code, ranking, onRestart }) {
  return (
    <div className="end-screen">
      <svg
        className="end-screen__rings"
        aria-hidden="true"
        viewBox="0 0 100 100"
      >
        {RINGS.map((r) => (
          <circle key={r} cx="50" cy="50" r={r} />
        ))}
      </svg>

      <nav className="end-screen__nav" aria-label="Hoofdmenu">
        <Link to="/" className="end-screen__logo">
          OPEN ICT QUIZ
        </Link>
        {/* TODO(team): Profiel en Uitloggen toevoegen zodra er login is. */}
        <span className="end-screen__code">
          CODE <strong>{code}</strong>
        </span>
      </nav>

      <main className="end-screen__main">
        <h1 className="end-screen__title">EINDSTAND</h1>
        {/* Eén ranking voor beide: zo zijn podium en scoreboard het altijd eens. */}
        <Podium ranking={ranking} />
        <Scoreboard rows={ranking.slice(3)} columns={2} />

        <div className="end-screen__actions">
          {onRestart ? (
            <button
              type="button"
              className="end-screen__button end-screen__button--primary"
              onClick={onRestart}
            >
              Nog een ronde
            </button>
          ) : (
            <Link
              to="/lobbyhost"
              className="end-screen__button end-screen__button--primary"
            >
              Nog een ronde
            </Link>
          )}
          <Link to="/" className="end-screen__button">
            Terug naar start
          </Link>
        </div>
      </main>
    </div>
  );
}

// Demo op /end met nepdata, om het design te bekijken zonder een hele game te spelen.
const SESSION_ID = 1;

export default function EndScreenPageHost() {
  const session = gameSessions.find((s) => s.id === SESSION_ID);
  const ranking = getRanking(
    gameResults.filter((result) => result.sessionId === SESSION_ID),
  );

  return <HostEndScreen code={session?.code} ranking={ranking} />;
}
