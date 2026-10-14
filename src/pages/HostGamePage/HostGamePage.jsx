import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/http.js";
import LockButton from "../../components/LockButton.jsx";
import QuizHeader from "../../components/QuizHeader.jsx";
import { useQuestionEvents } from "../../hooks/useQuestionEvents.js";
import { useSocketEvent } from "../../hooks/useSocketEvent.js";
import { EVENTS } from "../../socket/events.js";
import { withLocalStartsAt } from "../../socket/serverTime.js";
import { connectSocket, emitWithAck, socket } from "../../socket/socket.js";
import { HostEndScreen } from "../EndScreenPage_Host/EndScreenPage.jsx";
import { HostLeaderboard } from "../QuestionPage_Host/LeaderboardPage.jsx";
import { HostQuestionAnswers } from "../QuestionPage_Host/QuestionAnswersPage.jsx";
import { HostQuestionPreview } from "../QuestionPage_Host/QuestionPreviewPage.jsx";
import "./HostGamePage.css";

// Zelfde grens als MIN_PLAYERS in backend/game/Game.js. De server controleert het ook;
// hier is het alleen om de knop al uit te zetten.
const MIN_PLAYERS = 2;

// "localhost" betekent op elk apparaat "dit apparaat zelf". Staat dat in de join-link,
// dan zoekt een telefoon de quiz op de telefoon. Daarom waarschuwen we de host.
const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(
  window.location.hostname,
);

/** /host/new: maakt een game aan (de server zet de host-cookie) en gaat door naar /host/:code. */
export function HostCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  // StrictMode draait effects in development twee keer; zonder deze ref maak je twee games.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api("/games", { method: "POST" })
      .then(({ gameCode }) => navigate(`/host/${gameCode}`, { replace: true }))
      .catch((apiError) => setError(apiError.message));
  }, [navigate]);

  return (
    <div className="page">
      <QuizHeader large />
      <main className="page__main host-game">
        <p role="status">{error ?? "Lobby wordt aangemaakt…"}</p>
      </main>
    </div>
  );
}

/**
 * /host/:code: het grote scherm van de host.
 * Lobby → per vraag: leestijd, antwoorden, tussenstand → podium.
 * Welk scherm hangt af van game.phase, die de server stuurt.
 */
export default function HostGamePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api(`/games/${code}/me?role=host`)
      .then(() => {
        if (!cancelled) connectSocket(code, "host");
      })
      .catch(() => {
        if (!cancelled) navigate("/", { replace: true });
      });
    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [code, navigate]);

  useSocketEvent("connect", async () => {
    const response = await emitWithAck(EVENTS.GAME_SYNC).catch(() => null);
    if (response?.ok)
      setGame({
        ...response.state,
        question: withLocalStartsAt(response.state.question),
      });
  });

  // question:show, question:progress en question:end.
  useQuestionEvents(setGame);

  useSocketEvent(EVENTS.LOBBY_UPDATE, (lobby) => {
    setGame((current) => current && { ...current, lobby });
  });

  // Dezelfde broadcast als de spelers krijgen: zo is het podium gelijk aan hun eindstand.
  useSocketEvent(EVENTS.GAME_PODIUM, (podium) => {
    setGame((current) => current && { ...current, phase: "PODIUM", podium });
  });

  // ALLEEN DEVELOPMENT: quiz nep afspelen, omdat de echte vragen er nog niet zijn.
  async function finishForTesting(bots) {
    setBusy(true);
    setError(null);
    const response = await emitWithAck(EVENTS.DEV_FINISH, { bots }).catch(
      () => null,
    );
    if (!response?.ok)
      setError(response?.message ?? "Geen antwoord van de server.");
    setBusy(false);
  }

  async function startQuiz() {
    setBusy(true);
    setError(null);
    const response = await emitWithAck(EVENTS.HOST_START).catch(() => null);
    if (!response?.ok)
      setError(response?.message ?? "Geen antwoord van de server.");
    setBusy(false);
  }

  async function kickPlayer(playerId) {
    setError(null);
    const response = await emitWithAck(EVENTS.HOST_KICK_PLAYER, {
      playerId,
    }).catch(() => null);
    if (!response?.ok) {
      setError(
        response?.message ?? response?.error ?? "Kon speler niet verwijderen.",
      );
    }
  }

  // De server is de baas over het slot: we wachten op lobby:update in plaats van de knop
  // meteen om te zetten. Zo kan de knop nooit iets anders laten zien dan de server.
  async function toggleLock() {
    setBusy(true);
    setError(null);
    const response = await emitWithAck(EVENTS.HOST_LOCK, {
      locked: !game.lobby.locked,
    }).catch(() => null);
    if (!response?.ok)
      setError(response?.message ?? "Geen antwoord van de server.");
    setBusy(false);
  }

  // Eén actie voor "Antwoorden nu tonen", "Tijd stoppen" en "Volgende vraag" (zie Game.next op de server).
  async function next() {
    setError(null);
    const response = await emitWithAck(EVENTS.HOST_NEXT, {
      phase: game.phase,
      questionIndex: game.question?.index,
    }).catch(() => null);
    // WRONG_PHASE: dubbelklik of de timer was net eerder. Het nieuwe scherm komt vanzelf, dus geen melding.
    if (!response?.ok && response?.error !== "WRONG_PHASE")
      setError(response?.message ?? "Geen antwoord van de server.");
  }

  async function restart() {
    setError(null);
    const response = await emitWithAck(EVENTS.HOST_RESTART).catch(() => null);
    if (!response?.ok) {
      setError(response?.message ?? "Geen antwoord van de server.");
    }
  }

  useSocketEvent(EVENTS.GAME_RESTARTED, () => {
    setGame(
      (current) =>
        current && {
          ...current,
          phase: "LOBBY",
          podium: null,
          result: null,
          question: null,
          progress: null,
          questionEnd: null,
        },
    );
  });

  if (!game) {
    return (
      <div className="page">
        <QuizHeader code={code} large />
        <main className="page__main host-game">
          <p role="status">Verbinden…</p>
        </main>
      </div>
    );
  }

  if (game.phase === "PODIUM" && game.podium) {
    return (
      <>
        {error && (
          <p className="host-game__error host-game__error--top" role="alert">
            {error}
          </p>
        )}
        <HostEndScreen
          code={code}
          ranking={game.podium.ranking}
          onRestart={restart}
        />
      </>
    );
  }

  const errorBanner = error && (
    <p className="host-game__error host-game__error--top" role="alert">
      {error}
    </p>
  );

  if (game.phase === "QUESTION_PREVIEW" && game.question) {
    return (
      <>
        {errorBanner}
        <HostQuestionPreview
          code={code}
          question={game.question}
          onShowAnswers={next}
        />
      </>
    );
  }

  if (game.phase === "QUESTION_ACTIVE" && game.question) {
    return (
      <>
        {errorBanner}
        <HostQuestionAnswers
          code={code}
          question={game.question}
          answeredCount={game.progress?.answeredCount ?? 0}
          playerCount={game.progress?.playerCount ?? game.lobby.playerCount}
          onStopTime={next}
        />
      </>
    );
  }

  if (game.phase === "QUESTION_RESULT" && game.question && game.questionEnd) {
    return (
      <>
        {errorBanner}
        <HostLeaderboard
          code={code}
          question={game.question}
          correctOptionId={game.questionEnd.correctOptionId}
          answerCounts={game.questionEnd.answerCounts}
          playerCount={game.questionEnd.ranking.length}
          ranking={game.questionEnd.ranking}
          onNext={next}
        />
      </>
    );
  }

  const { players, playerCount, locked } = game.lobby;
  const canStart = playerCount >= MIN_PLAYERS;
  return (
    <div className="page">
      <QuizHeader code={code} large />
      <main className="page__main host-game">
        {isLocalhost && (
          <p className="host-game__warning" role="alert">
            <strong>Let op:</strong> je opent deze pagina via{" "}
            <code>{window.location.hostname}</code>. Een telefoon kan dat adres
            niet openen. Open de site op deze computer via zijn netwerkadres
            (bijv. <code>http://192.168.x.x:{window.location.port}</code>, je
            vindt het IP-adres met <code>ipconfig</code>) en maak daar een
            nieuwe lobby.
          </p>
        )}
        <p className="host-game__label">
          {locked
            ? "De lobby is op slot: nieuwe spelers kunnen niet meer meedoen."
            : `Ga naar ${window.location.host}/join en vul in:`}
        </p>
        <p className="host-game__code">{code}</p>
        <LockButton locked={locked} onToggle={toggleLock} disabled={busy} />
        <h1 className="host-game__title">
          {playerCount} {playerCount === 1 ? "speler" : "spelers"}
        </h1>

        <ul className="host-game__players">
          {players.map((player) => (
            <li
              key={player.id}
              className={player.connected ? "" : "host-game__player--offline"}
            >
              {/* Een echte <button>, zodat verwijderen ook met het toetsenbord werkt. */}
              <button
                type="button"
                className="host-game__kick"
                title={`${player.nickname} verwijderen`}
                aria-label={`${player.nickname} verwijderen`}
                onClick={() => kickPlayer(player.id)}
              >
                <span className="host-game__kick-name">{player.nickname}</span>
                {!player.connected && <span> (offline)</span>}
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="host-game__start"
          disabled={busy || !canStart}
          onClick={startQuiz}
        >
          Quiz starten
        </button>
        {!canStart && (
          <p className="host-game__hint">
            Er zijn minimaal {MIN_PLAYERS} spelers nodig om te starten.
          </p>
        )}

        {import.meta.env.DEV && (
          <section className="host-game__dev" aria-label="Alleen voor testen">
            <p>
              <strong>Alleen voor testen:</strong> sla de vragen over. Deze
              knoppen spelen 8 nepvragen voor iedereen en tonen meteen het
              podium.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => finishForTesting(0)}
            >
              Quiz afronden
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => finishForTesting(100 - playerCount)}
            >
              Afronden met testspelers (tot 100)
            </button>
          </section>
        )}
        {error && (
          <p className="host-game__error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
