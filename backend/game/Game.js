import { getRanking } from "../../src/utils/ranking.js";
import { GameError } from "./GameError.js";
import { nameKey, normalizeName, validateName } from "./nameRules.js";
import { PHASES } from "./phases.js";
import { buildPlayerResult } from "../../src/utils/playerResult.js";
import { calculatePoints } from "../../src/utils/scoring.js";
import { QUIZ_QUESTIONS } from "./quizQuestions.js";

// Met minder dan 2 spelers is het geen wedstrijd.
export const MIN_PLAYERS = 2;
// Een antwoord dat net na de tijd binnenkomt (vertraging van wifi of netwerk) telt nog mee.
const LATE_GRACE_MS = 500;

// Eén lopende game, in het geheugen van de server (projectplan 6).
// Deze klasse weet niets van Socket.IO of Express: ze houdt alleen de toestand bij.
// Zo kun je haar testen zonder server, en kunnen REST en sockets dezelfde regels gebruiken.
export class Game {
  /**
   * @param {string} code
   * @param {{ questions?: Array<Question>, previewSeconds?: number }} [options]
   *   previewSeconds = leestijd per vraag voordat je mag antwoorden (projectplan 3.4). 0 = meteen antwoorden.
   */
  constructor(code, { questions = QUIZ_QUESTIONS, previewSeconds = 5 } = {}) {
    this.code = code;
    this.phase = PHASES.LOBBY;
    this.locked = false;
    this.questions = questions;
    this.previewSeconds = previewSeconds;
    this.#resetQuestions();
    /** @type {Map<number, Player>} */
    this.players = new Map();
    this.nextPlayerId = 1;
    // De eindstand wordt één keer vastgezet bij het podium.
    // Verlaat iemand daarna het spel, dan blijft de eindstand van de rest gelijk.
    this.finalRanking = null;
    // Voor de database: welke ronde dit is (+1 bij herstart) en wanneer de lobby openging.
    this.round = 1;
    this.startedAt = new Date();
  }

  /** Nieuwe speler in de lobby. Gooit een GameError als het niet mag. */
  addPlayer(rawNickname, { isBot = false, skills } = {}) {
    if (this.phase !== PHASES.LOBBY)
      throw new GameError("WRONG_PHASE", "De quiz is al begonnen.", 403);
    if (this.locked)
      throw new GameError("LOBBY_LOCKED", "Deze lobby is gesloten.", 403);

    const nickname = normalizeName(rawNickname);
    const invalid = validateName(nickname);
    if (invalid)
      throw new GameError(
        invalid,
        "Gebruik 2 tot 20 letters, cijfers, spaties, - _ of .",
        400,
      );

    const key = nameKey(nickname);
    if (
      [...this.players.values()].some(
        (player) => nameKey(player.nickname) === key,
      )
    ) {
      throw new GameError(
        "NAME_TAKEN",
        "Deze naam is al bezet. Kies een andere naam.",
        409,
      );
    }

    const player = {
      id: this.nextPlayerId++,
      nickname,
      score: 0,
      correctCount: 0,
      // Punten per vraag. De totaalscore is altijd de som hiervan, zo kun je het narekenen.
      answers: [],
      connected: false,
      isVerified: false, // pas true met een account (L1)
      isBot,
      skills: cleanSkills(skills),
    };
    this.players.set(player.id, player);
    return player;
  }

  getPlayer(playerId) {
    return this.players.get(playerId) ?? null;
  }

  /** Speler vertrekt zelf. Mag altijd, ook op het podium ("Terug naar start"). */
  removePlayer(playerId) {
    return this.players.delete(playerId);
  }

  /** De host verwijdert een speler. Alleen in de lobby: midden in de quiz zou dat de stand verstoren. */
  kickPlayer(playerId) {
    if (this.phase !== PHASES.LOBBY) {
      throw new GameError(
        "WRONG_PHASE",
        "Kan geen spelers verwijderen nadat de quiz is gestart.",
        403,
      );
    }
    return this.removePlayer(playerId);
  }

  setConnected(playerId, connected) {
    const player = this.getPlayer(playerId);
    if (player) player.connected = connected;
  }

  get totalQuestions() {
    return this.questions.length;
  }

  /** De vraag die nu loopt (of net klaar is), of null in de lobby en bij het podium. */
  get currentQuestion() {
    return this.questions[this.questionIndex] ?? null;
  }

  /** Moment (ms) waarop de tijd voor de huidige vraag op is. */
  get endsAt() {
    return this.startsAt + this.currentQuestion.timeLimitSec * 1000;
  }

  isLastQuestion() {
    return this.questionIndex === this.totalQuestions - 1;
  }

  // ---------- De vraag-lus (projectplan 8.3) ----------
  // Elke methode krijgt `now` mee in plaats van zelf Date.now() te lezen.
  // Zo kan een test de tijd zelf kiezen ("antwoord na 5 seconden") zonder echt te wachten.

  /** Host start de quiz: de lobby gaat dicht en vraag 1 verschijnt. */
  start(now = Date.now()) {
    if (this.phase !== PHASES.LOBBY)
      throw new GameError("WRONG_PHASE", "De quiz is al begonnen.", 409);
    if (this.players.size < MIN_PLAYERS) {
      throw new GameError(
        "NOT_ENOUGH_PLAYERS",
        `Er zijn minimaal ${MIN_PLAYERS} spelers nodig.`,
        409,
      );
    }
    this.#showQuestion(0, now);
  }

  /**
   * host:next, één stap verder. Wat "verder" is, hangt af van de fase:
   * leestijd → antwoorden openen, antwoorden → vraag stoppen, uitslag → volgende vraag of podium.
   */
  next(now = Date.now()) {
    switch (this.phase) {
      case PHASES.QUESTION_PREVIEW:
        return this.openAnswers(now);
      case PHASES.QUESTION_ACTIVE:
        return this.endQuestion();
      case PHASES.QUESTION_RESULT:
        return this.isLastQuestion()
          ? this.finish()
          : this.#showQuestion(this.questionIndex + 1, now);
      default:
        throw new GameError("WRONG_PHASE", "Er is nu geen volgende stap.", 409);
    }
  }

  /** Leestijd voorbij (timer van de server) of de host slaat hem over: vanaf nu mag je antwoorden. */
  openAnswers(now = Date.now()) {
    if (this.phase !== PHASES.QUESTION_PREVIEW)
      throw new GameError("WRONG_PHASE", "De antwoorden zijn al open.", 409);
    // Overslaan = de tijd begint nu. Zo krijgt niemand minder tijd dan de tijdslimiet.
    this.startsAt = Math.min(this.startsAt, now);
    this.phase = PHASES.QUESTION_ACTIVE;
  }

  /** Een speler kiest een antwoord. Of het goed was, hoort hij pas als de vraag voorbij is. */
  submitAnswer(playerId, { questionIndex, optionId }, now = Date.now()) {
    if (!this.getPlayer(playerId))
      throw new GameError("NO_SESSION", "Je zit niet in deze game.", 403);
    if (
      this.phase !== PHASES.QUESTION_ACTIVE ||
      questionIndex !== this.questionIndex
    ) {
      throw new GameError(
        "WRONG_PHASE",
        "Deze vraag is niet (meer) open.",
        409,
      );
    }
    // Eén antwoord per vraag: anders kun je alle vier de knoppen proberen.
    if (this.currentAnswers.has(playerId))
      throw new GameError("ALREADY_ANSWERED", "Je hebt al geantwoord.", 409);
    if (now > this.endsAt + LATE_GRACE_MS)
      throw new GameError("TOO_LATE", "De tijd is op.", 409);
    if (
      !this.currentQuestion.options.some((option) => option.id === optionId)
    ) {
      throw new GameError("INVALID_OPTION", "Dit antwoord bestaat niet.", 400);
    }
    // De server meet de tijd, niet de client: een client kan liegen over hoe snel hij was.
    this.currentAnswers.set(playerId, {
      optionId,
      responseMs: Math.max(0, now - this.startsAt),
    });
  }

  /** Hoeveel spelers (die nog in de game zitten) al geantwoord hebben. Voor "9/12 antwoorden". */
  getAnsweredCount() {
    return [...this.currentAnswers.keys()].filter((id) => this.players.has(id))
      .length;
  }

  /** Hebben alle spelers die online zijn geantwoord? Dan hoeft niemand op de timer te wachten. */
  allAnswered() {
    const online = [...this.players.values()].filter(
      (player) => player.connected,
    );
    return (
      online.length > 0 &&
      online.every((player) => this.currentAnswers.has(player.id))
    );
  }

  /** Tijd op, iedereen heeft geantwoord, of de host stopt de tijd: punten uitdelen. */
  endQuestion() {
    if (this.phase !== PHASES.QUESTION_ACTIVE)
      throw new GameError("WRONG_PHASE", "De vraag is al gestopt.", 409);
    const question = this.currentQuestion;
    const correctOptionId = question.options.find(
      (option) => option.isCorrect,
    ).id;
    const answerCounts = Object.fromEntries(
      question.options.map((option) => [option.id, 0]),
    );

    for (const player of this.players.values()) {
      const answer = this.currentAnswers.get(player.id);
      if (answer) answerCounts[answer.optionId] += 1;
      const correct = answer?.optionId === correctOptionId;
      const points = calculatePoints({
        correct,
        responseMs: answer?.responseMs ?? 0,
        timeLimitSec: question.timeLimitSec,
      });
      // Geen antwoord telt als fout: 0 punten, maar wel een regel in answers (zo klopt "x van 8 goed").
      this.recordAnswer(player.id, {
        questionIndex: this.questionIndex,
        correct,
        points,
        optionId: answer?.optionId ?? null,
      });
    }

    this.lastQuestionEnd = {
      questionIndex: this.questionIndex,
      correctOptionId,
      answerCounts,
    };
    this.phase = PHASES.QUESTION_RESULT;
  }

  #showQuestion(index, now) {
    this.questionIndex = index;
    this.currentAnswers = new Map();
    this.lastQuestionEnd = null;
    this.startsAt = now + this.previewSeconds * 1000;
    this.phase =
      this.previewSeconds > 0
        ? PHASES.QUESTION_PREVIEW
        : PHASES.QUESTION_ACTIVE;
  }

  #resetQuestions() {
    this.questionIndex = -1;
    // Moment (ms) waarop je mag gaan antwoorden. Daarvóór is het leestijd.
    this.startsAt = null;
    /** @type {Map<number, { optionId: number, responseMs: number }>} antwoorden op de huidige vraag */
    this.currentAnswers = new Map();
    /** @type {{ questionIndex: number, correctOptionId: number, answerCounts: Record<number, number> } | null} */
    this.lastQuestionEnd = null;
  }

  /**
   * De huidige vraag voor de clients (question:show), ZONDER isCorrect.
   * serverTime: de klok van een laptop kan seconden afwijken van de server. Met serverTime erbij
   * rekent de client startsAt om naar zijn eigen klok (zie src/socket/serverTime.js).
   */
  getQuestionPayload(now = Date.now()) {
    const question = this.currentQuestion;
    if (!question) return null;
    return {
      phase: this.phase,
      index: this.questionIndex,
      total: this.totalQuestions,
      text: question.text,
      options: question.options.map(({ id, text }) => ({ id, text })),
      timeLimitSec: question.timeLimitSec,
      previewSeconds: this.previewSeconds,
      startsAt: this.startsAt,
      serverTime: now,
    };
  }

  /** Na de vraag (question:end): het goede antwoord, hoeveel mensen wat kozen, en de tussenstand. */
  getQuestionEndPayload() {
    if (!this.lastQuestionEnd) return null;
    const { questionIndex } = this.lastQuestionEnd;
    const ranking = this.getRanking().map(
      ({ id, nickname, score, rank, isVerified }) => ({
        id,
        nickname,
        score,
        rank,
        isVerified,
        pointsGained: this.#answerTo(id, questionIndex)?.points ?? 0,
      }),
    );
    return { ...this.lastQuestionEnd, ranking };
  }

  /** Eigen uitslag van de laatste vraag, alleen voor die speler: goed/fout en punten erbij. */
  getMyQuestionResult(playerId) {
    if (!this.lastQuestionEnd) return null;
    const answer = this.#answerTo(playerId, this.lastQuestionEnd.questionIndex);
    if (!answer) return null;
    return {
      questionIndex: answer.questionIndex,
      answered: answer.optionId != null,
      optionId: answer.optionId,
      correct: answer.correct,
      pointsGained: answer.points,
    };
  }

  /** Wat deze speler bij de huidige vraag al koos (na verversen blijft je keuze zo zichtbaar). */
  getMyAnswer(playerId) {
    return this.currentAnswers.get(playerId)?.optionId ?? null;
  }

  #answerTo(playerId, questionIndex) {
    return (
      this.getPlayer(playerId)?.answers.find(
        (answer) => answer.questionIndex === questionIndex,
      ) ?? null
    );
  }

  /** Antwoord op één vraag verwerken. De punten zijn al door de server berekend. */
  recordAnswer(playerId, { questionIndex, correct, points, optionId = null }) {
    const player = this.getPlayer(playerId);
    if (!player) return;
    player.answers.push({ questionIndex, correct, points, optionId });
    player.score += points;
    if (correct) player.correctCount += 1;
  }

  /** Spelers voor de lobbylijst, zonder scores of andere interne velden. */
  getLobbyPlayers() {
    return [...this.players.values()].map(
      ({ id, nickname, connected, isVerified }) => ({
        id,
        nickname,
        connected,
        isVerified,
      }),
    );
  }

  /** De huidige stand (tussenstand). Altijd via getRanking, net als podium en scoreboard. */
  getRanking() {
    return getRanking(
      [...this.players.values()].map(
        ({ id, nickname, score, correctCount, isVerified }) => ({
          id,
          nickname,
          score,
          correctCount,
          isVerified,
        }),
      ),
    );
  }

  /** Na de laatste vraag: stand vastzetten en naar het podium. */
  finish() {
    if (this.phase === PHASES.PODIUM)
      throw new GameError("WRONG_PHASE", "De quiz is al afgelopen.", 409);
    // De eindstand ís de laatste tussenstand: dezelfde functie op dezelfde scores.
    this.finalRanking = this.getRanking();
    this.phase = PHASES.PODIUM;
  }

  /** Eindstand zoals de clients hem krijgen (zonder correctCount van anderen). */
  getPublicRanking() {
    return (this.finalRanking ?? []).map(
      ({ id, nickname, score, rank, isVerified }) => ({
        id,
        nickname,
        score,
        rank,
        isVerified,
      }),
    );
  }

  /** Eigen resultaat voor het eindscherm, of null als de speler niet in de eindstand staat. */
  getPlayerResult(playerId) {
    if (!this.finalRanking) return null;
    return buildPlayerResult(this.finalRanking, playerId, this.totalQuestions);
  }

  /** Host herstart: zelfde spelers en namen, alle scores op 0, terug naar de lobby. */
  restart() {
    for (const player of this.players.values()) {
      player.score = 0;
      player.correctCount = 0;
      player.answers = [];
    }
    this.finalRanking = null;
    this.#resetQuestions();
    this.phase = PHASES.LOBBY;
    this.round += 1;
    this.startedAt = new Date();
  }

  /**
   * De eindstand als rijen voor de database (GameSession + GameResult).
   * Alleen een vertaling, zonder Prisma: zo is het te testen zonder database.
   */
  toSessionRecord(endedAt = new Date()) {
    if (!this.finalRanking) return null;
    return {
      code: this.code,
      round: this.round,
      startedAt: this.startedAt,
      endedAt,
      results: this.finalRanking.map(
        ({ id, nickname, score, rank, correctCount }) => {
          // skills en isBot staan niet in de ranking, dus die komen uit players.
          // Is de speler al vertrokken, dan zijn die extra's weg, maar de score blijft.
          const player = this.getPlayer(id);
          return {
            nickname,
            score,
            rank,
            correctCount,
            skills: player?.skills ?? {},
            isBot: player?.isBot ?? false,
          };
        },
      ),
    };
  }
}

// De client stuurt { "Frontend": 3, ... } mee bij het joinen. Nooit blind opslaan wat een
// browser stuurt: alleen een paar korte namen met een getal van 0 t/m 5 (het bereik van de slider).
function cleanSkills(skills) {
  if (!skills || typeof skills !== "object" || Array.isArray(skills)) return {};
  const entries = Object.entries(skills)
    .filter(
      ([label, value]) =>
        label.length <= 40 &&
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 5,
    )
    .slice(0, 10);
  return Object.fromEntries(entries);
}

/**
 * @typedef {{ text: string, timeLimitSec: number,
 *   options: Array<{ id: number, text: string, isCorrect: boolean }> }} Question
 */

/**
 * @typedef {{ id: number, nickname: string, score: number, correctCount: number,
 *   answers: Array<{ questionIndex: number, correct: boolean, points: number, optionId: number | null }>,
 *   connected: boolean, isVerified: boolean, isBot: boolean, skills: Record<string, number> }} Player
 */
