import { Link } from "react-router-dom";
import Podium from "../../components/Podium.jsx";
import Scoreboard from "../../components/Scoreboard.jsx";
import { gameResults, gameSessions } from "../../data/dummyDatabase.js";
import { getRanking } from "../../utils/ranking.js";
import "./EndScreenPage.css";

// TODO(team): dummy data vervangen door de echte uitslag (socket-event game:podium) zodra de server er is.
const SESSION_ID = 1;

// De vier cirkels op de achtergrond (straal in procenten van het vierkant).
const RINGS = [48, 38, 28, 18];

export default function EndScreenPageHost() {
  const session = gameSessions.find((s) => s.id === SESSION_ID);
  // Eén keer berekenen en aan beide geven: zo zijn podium en scoreboard het altijd eens.
  const ranking = getRanking(
    gameResults.filter((result) => result.sessionId === SESSION_ID),
  );

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
          CODE <strong>{session?.code}</strong>
        </span>
      </nav>

      <main className="end-screen__main">
        <h1 className="end-screen__title">EINDSTAND</h1>
        <Podium ranking={ranking} />
        <Scoreboard ranking={ranking} />

        {/* TODO(team): routes aanpassen zodra de echte host-flow er is. */}
        <div className="end-screen__actions">
          <Link
            to="/lobbyhost"
            className="end-screen__button end-screen__button--primary"
          >
            Nog een ronde
          </Link>
          <Link to="/" className="end-screen__button">
            Terug naar start
          </Link>
        </div>
      </main>
    </div>
  );
}
