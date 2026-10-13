import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/http.js";
import { useSocketEvent } from "../../hooks/useSocketEvent.js";
import { EVENTS } from "../../socket/events.js";
import { connectSocket, emitWithAck, socket } from "../../socket/socket.js";
import { HostEndScreen } from "../EndScreenPage_Host/EndScreenPage.jsx";
import "./HostGamePage.css";

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
    <main className="host-game">
      <p role="status">{error ?? "Lobby wordt aangemaakt…"}</p>
    </main>
  );
}

/**
 * /host/:code: het grote scherm van de host.
 * Nu: lobby (spelers live) en podium. TODO(team, fase 4): vragen en tussenstand.
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
    if (response?.ok) setGame(response.state);
  });

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
        current && { ...current, phase: "LOBBY", podium: null, result: null },
    );
  });

  if (!game) {
    return (
      <main className="host-game">
        <p role="status">Verbinden…</p>
      </main>
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

  const { players, playerCount } = game.lobby;
  return (
    <main className="host-game">
      <p className="host-game__label">
        Ga naar {window.location.host}/join en vul in:
      </p>
      <p className="host-game__code">{code}</p>
      <h1 className="host-game__title">
        {playerCount} {playerCount === 1 ? "speler" : "spelers"}
      </h1>
      <ul className="host-game__players">
        {players.map((player) => (
          <li
            key={player.id}
            className={player.connected ? "" : "host-game__player--offline"}
          >
            {player.nickname}
            {!player.connected && <span> (offline)</span>}
          </li>
        ))}
      </ul>

      {import.meta.env.DEV && (
        <section className="host-game__dev" aria-label="Alleen voor testen">
          <p>
            <strong>Alleen voor testen:</strong> er zijn nog geen vragen. Deze
            knoppen spelen 8 nepvragen voor iedereen en tonen dan het podium.
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
  );
}
