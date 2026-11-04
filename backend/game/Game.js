import { getRanking } from "../../src/utils/ranking.js";
import { GameError } from "./GameError.js";
import { nameKey, normalizeName, validateName } from "./nameRules.js";
import { PHASES } from "./phases.js";
import { buildPlayerResult } from "../../src/utils/playerResult.js";
import {
  calculatePoints,
  difficultyMultiplier,
} from "../../src/utils/scoring.js";
import { QUIZ_QUESTIONS } from "./quizQuestions.js";
import { TIME_OPTIONS } from "../quiz/quizRules.js";
import { selectQuestions } from "./questionSelector.js";
import { SKILL_CODES } from "../../src/utils/skills.js";
import {
  DEFAULT_QUESTION_COUNT,
  QUESTION_COUNT_OPTIONS,
} from "../../src/utils/randomQuiz.js";

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
   * @param {{ questions?: Array<Question>, previewSeconds?: number, quizId?: number | null,
   *   quizTitle?: string | null, settings?: { lockLobbyOnStart?: boolean } }} [options]
   *   previewSeconds = leestijd per vraag voordat je mag antwoorden (projectplan 3.4). 0 = meteen antwoorden.
   *   quizId/quizTitle = de quiz uit de database (story 7), voor de uitslagen.
   *   settings = instellingen van die quiz (story 8).
   */
  constructor(
    code,
    {
      questions = QUIZ_QUESTIONS,
      previewSeconds = 5,
      quizId = null,
      quizTitle = null,
      settings = {},
      questionBank = null,
    } = {},
  ) {
    this.code = code;
    this.quizId = quizId;
    this.quizTitle = quizTitle;
    this.settings = settings;
    this.phase = PHASES.LOBBY;
    this.locked = false;
    this.questionBank = questionBank;
    this.questionCount = questionBank ? DEFAULT_QUESTION_COUNT : null;
    this.questions = questionBank ? [] : questions;
    this.previewSeconds = previewSeconds;
    // Tijd per vraag die de host in de lobby kiest (in seconden).
    // null = de host koos niets: dan geldt de tijd die bij elke vraag in de quiz staat.
    this.timeLimitSec = null;
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
    // Per opgeslagen ronde: welke GameResult-rij bij welke speler hoort (een Promise, want opslaan
    // gebeurt op de achtergrond). Nodig om de score van een gast later aan zijn nieuwe account te koppelen.
    /** @type {Map<number, { resultIds: Promise<Map<number, number>> }>} ronde → (playerId → GameResult.id) */
    this.savedRounds = new Map();
  }

  /** Nieuwe speler in de lobby. Gooit een GameError als het niet mag. */
  /**
   * @param {{ isBot?: boolean, skills?: object, userId?: number | null }} [options]
   *   userId = het account van een ingelogde speler; die krijgt het account-icoontje (isVerified).
   */
  addPlayer(rawNickname, { isBot = false, skills, userId = null } = {}) {
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

    // Dubbele spelers. Een account controleren we op userId: hetzelfde account mag er maar één keer in
    // (ook niet via een tweede browser). Een account mag wél mee als een gast al dezelfde naam heeft:
    // de accountnaam is van hem, en het account-icoontje (isVerified) laat zien wie wie is.
    // Een gast mag geen naam nemen die al in de lobby zit, ook niet die van een account.
    const players = [...this.players.values()];
    if (userId !== null && players.some((player) => player.userId === userId)) {
      throw new GameError(
        "ALREADY_JOINED",
        "Je doet met dit account al mee aan deze quiz.",
        409,
      );
    }
    const key = nameKey(nickname);
    const clash =
      userId === null &&
      players.some((player) => nameKey(player.nickname) === key);
    if (clash) {
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
      userId,
      isVerified: userId !== null, // ingelogd met een account (sprint 2)
      isBot,
      skills: cleanSkills(skills),
    };
    this.players.set(player.id, player);
    return player;
  }

  getPlayer(playerId) {
    return this.players.get(playerId) ?? null;
  }

  /**
   * Een gast heeft tijdens of na de game een account gemaakt of is ingelogd (zie claimGuestResults).
   * Vanaf nu hoort deze speler bij dat account, met de accountnaam, ook in de vastgezette eindstand.
   * Zo kan een gast "John" die als Emma inlogt de echte John niet blokkeren.
   * (Al opgeslagen uitslagen houden de naam waaronder hij toen speelde.)
   * @param {{ id: number, username: string }} user
   */
  linkAccount(playerId, user) {
    const player = this.getPlayer(playerId);
    if (!player || player.userId !== null) return;
    // Zit dit account al in de game (bijv. vanuit een andere browser)? Dan niet nog een keer.
    if ([...this.players.values()].some((other) => other.userId === user.id)) return;
    player.userId = user.id;
    player.isVerified = true;
    player.nickname = user.username;
    const row = this.finalRanking?.find((entry) => entry.id === playerId);
    if (row) Object.assign(row, { isVerified: true, nickname: user.username });
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

  /**
   * De host zet de lobby op slot of weer open. Op slot = addPlayer weigert nieuwe spelers,
   * maar wie al in de lobby zit, blijft erin (ook na verversen, want die heeft een cookie).
   */
  setLocked(locked) {
    if (this.phase !== PHASES.LOBBY) {
      throw new GameError(
        "WRONG_PHASE",
        "De lobby kan alleen voor de start op slot.",
        409,
      );
    }
    this.locked = Boolean(locked);
  }
  /**
   * De host kiest in de lobby de tijd per vraag (bijv. 10 seconden voor snelle vragen).
   * null = terug naar de tijden uit de quiz. Na de start mag het niet meer:
   * dan zouden spelers midden in de quiz ineens minder tijd krijgen.
   */
  setTimeLimit(seconds) {
    if (this.phase !== PHASES.LOBBY) {
      throw new GameError(
        "WRONG_PHASE",
        "De tijd per vraag kan alleen in de lobby worden gekozen.",
        409,
      );
    }
    // Nooit blind overnemen wat een browser stuurt: alleen de vaste keuzes (of null) zijn goed.
    if (seconds !== null && !TIME_OPTIONS.includes(seconds)) {
      throw new GameError(
        "INVALID_TIME_LIMIT",
        "Kies een geldige tijd per vraag.",
        400,
      );
    }
    this.timeLimitSec = seconds;
  }

  setQuestionCount(count) {
    if (!this.questionBank) {
      throw new GameError(
        "NOT_RANDOM_QUIZ",
        "Het aantal vragen kies je alleen bij een willekeurige quiz.",
        409,
      );
    }
    if (this.phase !== PHASES.LOBBY) {
      throw new GameError(
        "WRONG_PHASE",
        "Het aantal vragen kan alleen in de lobby worden gekozen.",
        409,
      );
    }
    if (!QUESTION_COUNT_OPTIONS.includes(count)) {
      throw new GameError(
        "INVALID_QUESTION_COUNT",
        "Kies een geldig aantal vragen.",
        400,
      );
    }
    this.questionCount = count;
  }

  getSkillAverage() {
    const players = [...this.players.values()].filter(
      (player) => !player.isBot,
    );
    return Object.fromEntries(
      SKILL_CODES.map((code) => {
        const values = players
          .map((player) => player.skills[code])
          .filter((value) => value !== undefined);
        if (values.length === 0) return [code, null];
        const total = values.reduce((sum, value) => sum + value, 0);
        return [code, total / values.length];
      }),
    );
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

  /** Hoeveel seconden de huidige vraag duurt: de keuze van de host, anders de tijd uit de quiz. */
  get currentTimeLimitSec() {
    return this.timeLimitSec ?? this.currentQuestion.timeLimitSec;
  }

  /** Moment (ms) waarop de tijd voor de huidige vraag op is. */
  get endsAt() {
    return this.startsAt + this.currentTimeLimitSec * 1000;
  }

  isLastQuestion() {
    return this.questionIndex === this.totalQuestions - 1;
  }

  // ---------- De vraag-lus (projectplan 8.3) ----------
  // Elke methode krijgt `now` mee in plaats van zelf Date.now() te lezen.
  // Zo kan een test de tijd zelf kiezen ("antwoord na 5 seconden") zonder echt te wachten.

  /** Host start de quiz: de lobby gaat dicht en vraag 1 verschijnt. */
  start(now = Date.now(), random = Math.random) {
    if (this.phase !== PHASES.LOBBY)
      throw new GameError("WRONG_PHASE", "De quiz is al begonnen.", 409);
    if (this.players.size < MIN_PLAYERS) {
      throw new GameError(
        "NOT_ENOUGH_PLAYERS",
        `Er zijn minimaal ${MIN_PLAYERS} spelers nodig.`,
        409,
      );
    }
    // Instelling van de quiz (story 8): na de start gaat de lobby op slot,
    // dus ook na "opnieuw spelen" kan er niemand meer bij tot de host hem weer openzet.
    if (this.settings.lockLobbyOnStart) this.locked = true;
    if (this.questionBank) {
      this.questions = selectQuestions(
        this.questionBank,
        this.getSkillAverage(),
        this.questionCount,
        random,
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

  /**
   * host:pause, "Tijd stoppen": de klok staat stil, maar de vraag blijft staan.
   * Zo kan de docent de vraag met de klas bespreken. Daarna gaat host:next naar de tussenstand.
   * Spelers mogen tijdens de pauze nog antwoorden; hun punten tellen alsof ze op het pauzemoment antwoordden,
   * zodat wachten op de uitleg van de docent geen extra punten oplevert.
   */
  pauseTimer(now = Date.now()) {
    if (this.phase !== PHASES.QUESTION_ACTIVE)
      throw new GameError("WRONG_PHASE", "Er loopt nu geen tijd.", 409);
    if (this.paused)
      throw new GameError("WRONG_PHASE", "De tijd staat al stil.", 409);
    this.paused = true;
    // Nooit later dan het einde van de tijd: dan was de vraag eigenlijk al voorbij.
    this.pausedAt = Math.min(now, this.endsAt);
  }

  /**
   * Een speler kiest een antwoord. Of het goed was, hoort hij pas als de vraag voorbij is.
   * Gewone vraag: optionId. Vraag met meerdere goede antwoorden: optionIds (alle antwoorden die je aanvinkt).
   */
  submitAnswer(playerId, { questionIndex, optionId, optionIds }, now = Date.now()) {
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
    // Staat de tijd stil (pauze), dan is hij ook niet op.
    if (!this.paused && now > this.endsAt + LATE_GRACE_MS)
      throw new GameError("TOO_LATE", "De tijd is op.", 409);
    const chosen = cleanChoice(this.currentQuestion, { optionId, optionIds });
    // De server meet de tijd, niet de client: een client kan liegen over hoe snel hij was.
    // Tijdens een pauze telt het pauzemoment, niet "nu".
    const answeredAt = this.paused ? this.pausedAt : now;
    this.currentAnswers.set(playerId, {
      optionIds: chosen,
      responseMs: Math.max(0, answeredAt - this.startsAt),
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
    const correctOptionIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id);
    const answerCounts = Object.fromEntries(
      question.options.map((option) => [option.id, 0]),
    );
    let correctPlayerCount = 0;
    const multiplier = difficultyMultiplier(question.difficulty);

    for (const player of this.players.values()) {
      const answer = this.currentAnswers.get(player.id);
      for (const id of answer?.optionIds ?? []) answerCounts[id] += 1;
      // Goed = precies de goede antwoorden gekozen. Bij meerdere goede: allemaal, en geen foute erbij.
      const correct =
        Boolean(answer) && sameIds(answer.optionIds, correctOptionIds);
      if (correct) correctPlayerCount += 1;
      const points = calculatePoints({
        correct,
        responseMs: answer?.responseMs ?? 0,
        timeLimitSec: this.currentTimeLimitSec,
        difficulty: question.difficulty,
      });
      // Geen antwoord telt als fout: 0 punten, maar wel een regel in answers (zo klopt "x van 8 goed").
      this.recordAnswer(player.id, {
        questionIndex: this.questionIndex,
        correct,
        points,
        optionIds: answer?.optionIds ?? [],
      });
    }

    this.lastQuestionEnd = {
      questionIndex: this.questionIndex,
      // correctOptionId (het eerste goede) blijft voor oudere schermen; correctOptionIds is de hele lijst.
      correctOptionId: correctOptionIds[0],
      correctOptionIds,
      correctPlayerCount,
      answerCounts,
      // Pas ná de vraag: bij welke vaardigheid (beroepsrol) de vraag hoorde en hoe moeilijk hij was.
      // Tijdens de vraag sturen we dit niet mee (zie getQuestionPayload).
      skill: question.skill ?? null,
      difficulty: question.difficulty ?? null,
      multiplier,
    };
    this.phase = PHASES.QUESTION_RESULT;
  }

  #showQuestion(index, now) {
    this.questionIndex = index;
    this.currentAnswers = new Map();
    this.lastQuestionEnd = null;
    this.paused = false;
    this.pausedAt = null;
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
    // "Tijd stoppen": paused = de klok staat stil sinds pausedAt (ms).
    this.paused = false;
    this.pausedAt = null;
    /** @type {Map<number, { optionIds: number[], responseMs: number }>} antwoorden op de huidige vraag */
    this.currentAnswers = new Map();
    /** @type {{ questionIndex: number, correctOptionId: number, correctOptionIds: number[], correctPlayerCount: number, answerCounts: Record<number, number> } | null} */
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
      // Meerdere goede antwoorden? Dan vinkt de speler aan en verstuurt hij zelf. Hoeveel er goed zijn, zeggen we niet.
      multiple: isMultiple(question),
      multiplier: difficultyMultiplier(question.difficulty),
      timeLimitSec: this.currentTimeLimitSec,
      previewSeconds: this.previewSeconds,
      startsAt: this.startsAt,
      // Tijd gestopt? Dan tonen de schermen een stilstaande klok met zoveel ms over.
      paused: this.paused,
      pausedMsLeft: this.paused ? Math.max(0, this.endsAt - this.pausedAt) : null,
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
    // Instellingen van de quiz (story 8): goede antwoord en tussenstand wel of niet op het grote scherm.
    const display = {
      showCorrectAnswer: this.settings.showCorrectAnswer ?? true,
      showStandings: this.settings.showStandings ?? true,
    };
    return { ...this.lastQuestionEnd, ranking, display };
  }

  /** Eigen uitslag van de laatste vraag, alleen voor die speler: goed/fout en punten erbij. */
  getMyQuestionResult(playerId) {
    if (!this.lastQuestionEnd) return null;
    const answer = this.#answerTo(playerId, this.lastQuestionEnd.questionIndex);
    if (!answer) return null;
    return {
      questionIndex: answer.questionIndex,
      answered: answer.optionIds.length > 0,
      optionId: answer.optionIds[0] ?? null,
      optionIds: answer.optionIds,
      correct: answer.correct,
      pointsGained: answer.points,
      multiplier: this.lastQuestionEnd.multiplier,
    };
  }

  /**
   * Wat deze speler bij de huidige vraag al koos (na verversen blijft je keuze zo zichtbaar).
   * Gewone vraag: één optionId. Vraag met meerdere goede antwoorden: de lijst optionIds.
   */
  getMyAnswer(playerId) {
    const answer = this.currentAnswers.get(playerId);
    if (!answer) return null;
    return isMultiple(this.currentQuestion)
      ? answer.optionIds
      : answer.optionIds[0];
  }

  #answerTo(playerId, questionIndex) {
    return (
      this.getPlayer(playerId)?.answers.find(
        (answer) => answer.questionIndex === questionIndex,
      ) ?? null
    );
  }

  /** Antwoord op één vraag verwerken. De punten zijn al door de server berekend. */
  recordAnswer(playerId, { questionIndex, correct, points, optionIds = [] }) {
    const player = this.getPlayer(playerId);
    if (!player) return;
    player.answers.push({ questionIndex, correct, points, optionIds });
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
      quizId: this.quizId,
      quizTitle: this.quizTitle,
      questionCount: this.totalQuestions,
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
            userId: player?.userId ?? null,
          };
        },
      ),
    };
  }
}

/** Heeft deze vraag meer dan één goed antwoord? */
function isMultiple(question) {
  return question.options.filter((option) => option.isCorrect).length > 1;
}

/** Zelfde getallen, volgorde maakt niet uit. */
function sameIds(a, b) {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/**
 * Controleert de keuze van een speler en geeft een gesorteerde lijst optionIds terug.
 * Nooit blind geloven wat de browser stuurt: bestaande antwoorden, geen dubbele, en bij een gewone vraag precies één.
 */
function cleanChoice(question, { optionId, optionIds }) {
  const ids = Array.isArray(optionIds) ? optionIds : [optionId];
  const valid =
    ids.length > 0 &&
    new Set(ids).size === ids.length &&
    ids.every((id) => question.options.some((option) => option.id === id));
  if (!valid)
    throw new GameError("INVALID_OPTION", "Dit antwoord bestaat niet.", 400);
  if (!isMultiple(question) && ids.length !== 1)
    throw new GameError("INVALID_OPTION", "Kies één antwoord.", 400);
  return [...ids].sort((a, b) => a - b);
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
 * @typedef {{ text: string, timeLimitSec: number, skill?: string | null, difficulty?: number | null,
 *   options: Array<{ id: number, text: string, isCorrect: boolean }> }} Question
 *   Meer dan één isCorrect = een vraag waarbij de speler alle goede antwoorden kiest.
 */

/**
 * @typedef {{ id: number, nickname: string, score: number, correctCount: number,
 *   answers: Array<{ questionIndex: number, correct: boolean, points: number, optionIds: number[] }>,
 *   connected: boolean, userId: number | null, isVerified: boolean, isBot: boolean,
 *   skills: Record<string, number> }} Player
 */
