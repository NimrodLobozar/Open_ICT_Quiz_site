import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/http.js";
import QuizHeader from "../../components/QuizHeader.jsx";
import { useQuestionEvents } from "../../hooks/useQuestionEvents.js";
import { useSocketEvent } from "../../hooks/useSocketEvent.js";
import { EVENTS } from "../../socket/events.js";
import { withLocalStartsAt } from "../../socket/serverTime.js";
import { connectSocket, emitWithAck, socket } from "../../socket/socket.js";
import { PlayerEndScreen } from "../EndScreenPage_Player/EndScreenPage.jsx";
import { PlayerQuestion } from "../QuestionPage_Player/PlayerQuestionPage.jsx";
import { PlayerQuestionResult } from "../QuestionPage_Player/PlayerResultPage.jsx";
import "./PlayerGamePage.css";

/**
 * /play/:code: alles wat een speler tijdens een game ziet.
 * Welk scherm hangt af van de fase die de server stuurt (wachten → … → eindscherm).
 *
 * Hoe de data binnenkomt:
 * 1. Bij elke (her)verbinding vragen we de hele toestand op met game:sync. Zo werkt verversen.
 * 2. Daarna houden live-events (lobby:update, game:podium, player:result) de toestand bij.
 */
export default function PlayerGamePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  // Wat de server ons vertelt: { phase, me, lobby, podium, result }. null = nog niets ontvangen.
  const [game, setGame] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState(null);
  const [answerError, setAnswerError] = useState(null);

  // Eerst via REST checken of deze browser een speler-sessie heeft, pas dan de socket openen.
  useEffect(() => {
    let cancelled = false;
    api(`/games/${code}/me`)
      .then(() => {
        if (!cancelled) connectSocket(code, "player");
      })
      .catch(() => {
        // Geen (geldige) cookie: terug naar het joinformulier van deze game.
        if (!cancelled) navigate(`/join/${code}`, { replace: true });
      });

    return () => {
      cancelled = true;
      // Pagina weg = verbinding dicht. De server zet ons dan op "offline".
      socket.disconnect();
    };
  }, [code, navigate]);

  // 'connect' komt na de eerste verbinding én na elke automatische reconnect.
  // In beide gevallen kunnen we events gemist hebben, dus de hele toestand opnieuw opvragen.
  useSocketEvent("connect", async () => {
    setConnected(true);
    try {
      const response = await emitWithAck(EVENTS.GAME_SYNC);
      if (response.ok)
        setGame({
          ...response.state,
          question: withLocalStartsAt(response.state.question),
        });
    } catch {
      // Geen antwoord binnen de timeout: de volgende reconnect probeert het opnieuw.
    }
  });

  useSocketEvent("disconnect", () => setConnected(false));

  // De middleware op de server weigerde ons (bijv. server herstart, sessie weg).
  useSocketEvent("connect_error", (error) => {
    if (error.message === "NO_SESSION")
      navigate(`/join/${code}`, { replace: true });
  });

  useSocketEvent(EVENTS.LOBBY_UPDATE, (lobby) => {
    setGame((current) => current && { ...current, lobby });
  });

  // Broadcast naar iedereen: de quiz is klaar. Het eigen resultaat komt direct daarna (player:result).
  useSocketEvent(EVENTS.GAME_PODIUM, (podium) => {
    setGame(
      (current) =>
        current && { ...current, phase: "PODIUM", podium, result: null },
    );
  });

  // Alleen naar deze speler gestuurd.
  useSocketEvent(EVENTS.PLAYER_RESULT, (result) => {
    setGame((current) => current && { ...current, result });
  });

  useSocketEvent(EVENTS.GAME_RESTARTED, () => {
    setGame(
      (current) =>
        current && {
          ...current,
          phase: "LOBBY",
          podium: null,
          result: null,
          question: null,
          questionEnd: null,
          myQuestionResult: null,
          myAnswer: null,
          me: current.me && { ...current.me, score: 0 },
        },
    );
  });

  // question:show, question:end en question:my-result.
  useQuestionEvents(setGame);

  // Antwoord kiezen. We tonen je keuze meteen (anders voelt het traag op slechte wifi),
  // en draaien dat terug als de server het weigert.
  async function answer(optionId) {
    const questionIndex = game.question.index;
    setAnswerError(null);
    setGame((current) => current && { ...current, myAnswer: optionId });
    const response = await emitWithAck(EVENTS.PLAYER_ANSWER, {
      questionIndex,
      optionId,
    }).catch(() => null);
    if (response?.ok || response?.error === "ALREADY_ANSWERED") return;
    // Alleen terugdraaien als we nog bij dezelfde vraag zijn.
    setGame((current) =>
      current?.question?.index === questionIndex
        ? { ...current, myAnswer: null }
        : current,
    );
    setAnswerError(
      response?.message ?? "Je antwoord kwam niet aan. Probeer het opnieuw.",
    );
  }

  // Bij een nieuwe vraag hoort een oude foutmelding er niet meer bij.
  const questionIndex = game?.question?.index;
  useEffect(() => setAnswerError(null), [questionIndex]);

  async function leaveGame() {
    setLeaving(true);
    setLeaveError(null);
    try {
      await api(`/games/${code}/players/me`, { method: "DELETE" });
      socket.disconnect();
      navigate("/");
    } catch {
      setLeaveError(
        "Verlaten lukte niet. Controleer je verbinding en probeer het opnieuw.",
      );
      setLeaving(false);
    }
  }

  return (
    <>
      {/* Bij zelf vertrekken verbreekt de server ons ook; dan is dit geen storing. */}
      {!connected && game && !leaving && (
        <p className="player-game__offline" role="status">
          Verbinding kwijt, opnieuw verbinden…
        </p>
      )}
      <PhaseScreen
        game={game}
        code={code}
        onLeave={leaveGame}
        leaving={leaving}
        leaveError={leaveError}
        onAnswer={answer}
        answerError={answerError}
      />
    </>
  );
}

function PhaseScreen({
  game,
  code,
  onLeave,
  leaving,
  leaveError,
  onAnswer,
  answerError,
}) {
  if (!game) return <WaitScreen code={code} title="Verbinden…" />;

  const inQuestion =
    game.phase === "QUESTION_PREVIEW" || game.phase === "QUESTION_ACTIVE";
  if (inQuestion && game.question) {
    return (
      <PlayerQuestion
        // key: bij een nieuwe vraag een vers scherm, zonder resten van de vorige.
        key={game.question.index}
        code={code}
        question={game.question}
        nickname={game.me?.nickname}
        score={game.me?.score ?? 0}
        chosenOptionId={game.myAnswer}
        onAnswer={onAnswer}
        error={answerError}
      />
    );
  }

  if (game.phase === "QUESTION_RESULT") {
    // question:end en question:my-result komen vlak na elkaar. Even wachten tot ze er allebei zijn.
    if (!game.questionEnd || !game.myQuestionResult) {
      return <WaitScreen code={code} title="Uitslag laden…" />;
    }
    return (
      <PlayerQuestionResult
        code={code}
        question={game.question}
        correctOptionId={game.questionEnd.correctOptionId}
        ranking={game.questionEnd.ranking}
        myResult={game.myQuestionResult}
        myPlayerId={game.me?.playerId}
      />
    );
  }

  if (game.phase === "PODIUM" && game.podium) {
    return (
      <PlayerEndScreen
        code={code}
        ranking={game.podium.ranking}
        result={game.result}
        onLeave={onLeave}
        leaving={leaving}
        leaveError={leaveError}
      />
    );
  }

  if (game.phase === "LOBBY") {
    return (
      <WaitScreen code={code} title="Je zit erin!">
        <p>
          Je speelt als <strong>{game.me?.nickname}</strong>. Wacht tot de host
          de quiz start.
        </p>
        <p>
          {game.lobby.playerCount}{" "}
          {game.lobby.playerCount === 1 ? "speler" : "spelers"} in de lobby
        </p>
      </WaitScreen>
    );
  }

  // Bijv. PODIUM terwijl de eindstand nog onderweg is.
  return <WaitScreen code={code} title="Even wachten…" />;
}

function WaitScreen({ code, title, children }) {
  return (
    <div className="page">
      <QuizHeader code={code} />
      <main className="page__main player-game__wait">
        <h1 className="player-game__title">{title}</h1>
        {children}
      </main>
    </div>
  );
}
