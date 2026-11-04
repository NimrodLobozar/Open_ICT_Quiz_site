import { beforeEach, describe, expect, it } from "vitest";
import { Game, shuffle } from "../game/Game.js";
import { PHASES } from "../game/phases.js";
import { QUIZ_QUESTIONS } from "../game/quizQuestions.js";
import { QUESTION_BANK } from "../game/questionBank.js";
import { DEFAULT_QUESTION_COUNT } from "../../src/utils/randomQuiz.js";

describe("Game", () => {
  let game;

  beforeEach(() => {
    game = new Game("482913", { questions: QUIZ_QUESTIONS.slice(0, 3) });
  });

  it("weigert dezelfde naam met andere hoofdletters of spaties", () => {
    game.addPlayer("Nimród");
    expect(() => game.addPlayer("  NIMRÓD ")).toThrow(
      expect.objectContaining({ code: "NAME_TAKEN" }),
    );
  });

  it("laat een account meedoen als een gast al dezelfde naam heeft (met account-icoontje)", () => {
    const guest = game.addPlayer("John");
    const account = game.addPlayer("john", { userId: 7 });
    expect(guest.isVerified).toBe(false);
    expect(account.isVerified).toBe(true);
    expect(game.getLobbyPlayers()).toHaveLength(2);
  });

  it("weigert een gast met de naam van een account dat al in de lobby zit", () => {
    game.addPlayer("John", { userId: 7 });
    expect(() => game.addPlayer("JOHN")).toThrow(
      expect.objectContaining({ code: "NAME_TAKEN" }),
    );
  });

  it("laat hetzelfde account niet twee keer meedoen, ook niet onder een andere naam", () => {
    game.addPlayer("John", { userId: 7 });
    expect(() => game.addPlayer("Johnny", { userId: 7 })).toThrow(
      expect.objectContaining({ code: "ALREADY_JOINED" }),
    );
  });

  it("een gekoppelde gast krijgt de accountnaam en blokkeert de echte eigenaar van zijn gastnaam niet", () => {
    const guest = game.addPlayer("John");
    game.linkAccount(guest.id, { id: 5, username: "Emma" });
    expect(guest).toMatchObject({ nickname: "Emma", userId: 5, isVerified: true });
    // Het echte John-account kan nu gewoon meedoen.
    expect(() => game.addPlayer("John", { userId: 9 })).not.toThrow();
    // En Emma kan niet nog een keer meedoen vanuit een andere browser.
    expect(() => game.addPlayer("Emma", { userId: 5 })).toThrow(
      expect.objectContaining({ code: "ALREADY_JOINED" }),
    );
  });

  it("weigert te korte, te lange en rare namen", () => {
    expect(() => game.addPlayer("A")).toThrow(
      expect.objectContaining({ code: "NAME_INVALID" }),
    );
    expect(() => game.addPlayer("x".repeat(21))).toThrow(
      expect.objectContaining({ code: "NAME_INVALID" }),
    );
    expect(() => game.addPlayer("<script>")).toThrow(
      expect.objectContaining({ code: "NAME_INVALID" }),
    );
  });

  it("geeft de naam vrij als een speler vertrekt", () => {
    const sam = game.addPlayer("Sam");
    game.removePlayer(sam.id);
    expect(() => game.addPlayer("sam")).not.toThrow();
  });

  it("telt de totaalscore op uit de punten per vraag", () => {
    const emma = game.addPlayer("Emma");
    game.recordAnswer(emma.id, {
      questionIndex: 0,
      correct: true,
      points: 900,
    });
    game.recordAnswer(emma.id, { questionIndex: 1, correct: false, points: 0 });
    game.recordAnswer(emma.id, {
      questionIndex: 2,
      correct: true,
      points: 700,
    });
    expect(emma.score).toBe(
      emma.answers.reduce((sum, answer) => sum + answer.points, 0),
    );
    expect(emma.correctCount).toBe(2);
  });

  it("zet bij finish de eindstand gelijk aan de laatste tussenstand", () => {
    const a = game.addPlayer("Anna");
    const b = game.addPlayer("Bram");
    game.recordAnswer(a.id, { questionIndex: 0, correct: true, points: 800 });
    game.recordAnswer(b.id, { questionIndex: 0, correct: true, points: 800 });
    const lastLeaderboard = game.getRanking();

    game.finish();

    expect(game.phase).toBe(PHASES.PODIUM);
    expect(game.finalRanking).toEqual(lastLeaderboard);
    expect(game.getPlayerResult(b.id)).toMatchObject({
      rank: 1,
      playerCount: 2,
    });
  });

  it("houdt de eindstand gelijk als een speler na het podium vertrekt", () => {
    const a = game.addPlayer("Anna");
    const b = game.addPlayer("Bram");
    game.recordAnswer(a.id, { questionIndex: 0, correct: true, points: 800 });
    game.finish();
    game.removePlayer(a.id);
    expect(game.getPlayerResult(b.id)).toMatchObject({
      rank: 2,
      playerCount: 2,
      pointsToNext: 800,
    });
  });

  it("laat geen nieuwe spelers toe na de start", () => {
    game.finish();
    expect(() => game.addPlayer("Laat")).toThrow(
      expect.objectContaining({ code: "WRONG_PHASE" }),
    );
  });

  it("houdt bij restart dezelfde spelers en namen, met score 0, in de lobby", () => {
    const emma = game.addPlayer("Emma");
    game.recordAnswer(emma.id, {
      questionIndex: 0,
      correct: true,
      points: 1000,
    });
    game.finish();

    game.restart();

    expect(game.phase).toBe(PHASES.LOBBY);
    expect(game.finalRanking).toBeNull();
    expect(game.getPlayer(emma.id)).toMatchObject({
      nickname: "Emma",
      score: 0,
      correctCount: 0,
      answers: [],
    });
  });
});

describe("Game: de vraag-lus", () => {
  let game;
  let emma;
  let sam;
  const T0 = 1_000_000; // een vast "nu", zodat de tests niet van de echte klok afhangen

  beforeEach(() => {
    game = new Game("482913", {
      questions: QUIZ_QUESTIONS.slice(0, 2),
      previewSeconds: 5,
    });
    emma = game.addPlayer("Emma");
    sam = game.addPlayer("Sam");
  });

  // Vraag 1 van QUIZ_QUESTIONS: optie 1 (HTML) is goed.
  const CORRECT = 1;
  const WRONG = 2;

  it("start pas met minimaal 2 spelers", () => {
    const alone = new Game("111111");
    alone.addPlayer("Emma");
    expect(() => alone.start(T0)).toThrow(
      expect.objectContaining({ code: "NOT_ENOUGH_PLAYERS" }),
    );
    expect(alone.phase).toBe(PHASES.LOBBY);
  });

  it("weigert nieuwe spelers als de lobby op slot zit, en laat ze weer toe na openen", () => {
    game.setLocked(true);
    expect(() => game.addPlayer("Noah")).toThrow(
      expect.objectContaining({ code: "LOBBY_LOCKED" }),
    );
    expect(game.getPlayer(emma.id)).not.toBeNull();
    game.setLocked(false);
    expect(() => game.addPlayer("Noah")).not.toThrow();
    game.start(T0);
    expect(() => game.setLocked(true)).toThrow(
      expect.objectContaining({ code: "WRONG_PHASE" }),
    );
  });

  it("laat de host alleen in de lobby spelers verwijderen", () => {
    game.addPlayer("Noah"); // zodat er na het verwijderen nog 2 spelers zijn om te starten
    game.kickPlayer(emma.id);
    expect(game.getPlayer(emma.id)).toBeNull();
    game.start(T0);
    expect(() => game.kickPlayer(sam.id)).toThrow(
      expect.objectContaining({ code: "WRONG_PHASE" }),
    );
    expect(game.getPlayer(sam.id)).not.toBeNull();
  });

  it("begint met leestijd en opent daarna de antwoorden", () => {
    game.start(T0);
    expect(game.phase).toBe(PHASES.QUESTION_PREVIEW);
    expect(game.startsAt).toBe(T0 + 5000);
    expect(() =>
      game.submitAnswer(
        emma.id,
        { questionIndex: 0, optionId: CORRECT },
        T0 + 1000,
      ),
    ).toThrow(expect.objectContaining({ code: "WRONG_PHASE" }));

    game.openAnswers(T0 + 5000);
    expect(game.phase).toBe(PHASES.QUESTION_ACTIVE);
  });

  it("gebruikt zonder keuze van de host de tijd uit de quiz", () => {
    game.start(T0);
    expect(game.getQuestionPayload(T0).timeLimitSec).toBe(
      QUIZ_QUESTIONS[0].timeLimitSec,
    );
  });

  it("gebruikt de tijd per vraag die de host in de lobby koos", () => {
    game.setTimeLimit(10);
    game.start(T0);
    game.openAnswers(T0 + 5000);

    // Iedereen krijgt de nieuwe tijd mee, en de server stopt de vraag na 10 seconden.
    expect(game.getQuestionPayload(T0 + 5000).timeLimitSec).toBe(10);
    expect(game.endsAt).toBe(T0 + 5000 + 10_000);
    expect(() =>
      game.submitAnswer(
        emma.id,
        { questionIndex: 0, optionId: CORRECT },
        T0 + 5000 + 11_000,
      ),
    ).toThrow(expect.objectContaining({ code: "TOO_LATE" }));
  });

  it("weigert een ongeldige tijd, en een nieuwe tijd na de start", () => {
    expect(() => game.setTimeLimit(7)).toThrow(
      expect.objectContaining({ code: "INVALID_TIME_LIMIT" }),
    );
    expect(() => game.setTimeLimit("30")).toThrow(
      expect.objectContaining({ code: "INVALID_TIME_LIMIT" }),
    );

    game.setTimeLimit(30);
    game.setTimeLimit(null); // terug naar de tijden uit de quiz
    expect(game.timeLimitSec).toBeNull();

    game.start(T0);
    expect(() => game.setTimeLimit(30)).toThrow(
      expect.objectContaining({ code: "WRONG_PHASE" }),
    );
  });

  it("laat de tijd nu beginnen als de host de leestijd overslaat", () => {
    game.start(T0);
    game.next(T0 + 2000);
    expect(game.phase).toBe(PHASES.QUESTION_ACTIVE);
    expect(game.startsAt).toBe(T0 + 2000);
  });

  it("geeft meer punten voor sneller antwoorden, en 0 voor fout of geen antwoord", () => {
    const lisa = game.addPlayer("Lisa");
    game.start(T0);
    game.openAnswers(T0 + 5000);
    game.submitAnswer(
      emma.id,
      { questionIndex: 0, optionId: CORRECT },
      T0 + 5000,
    ); // direct
    game.submitAnswer(sam.id, { questionIndex: 0, optionId: WRONG }, T0 + 6000);
    game.endQuestion();

    expect(game.phase).toBe(PHASES.QUESTION_RESULT);
    expect(game.getPlayer(emma.id).score).toBe(1000);
    expect(game.getPlayer(sam.id).score).toBe(0);
    expect(game.getMyQuestionResult(lisa.id)).toMatchObject({
      answered: false,
      correct: false,
      pointsGained: 0,
    });
    expect(game.getQuestionEndPayload()).toMatchObject({
      correctOptionId: CORRECT,
      answerCounts: { 1: 1, 2: 1, 3: 0, 4: 0 },
    });
  });

  it("telt maar één antwoord per speler", () => {
    game.start(T0);
    game.openAnswers(T0 + 5000);
    game.submitAnswer(
      emma.id,
      { questionIndex: 0, optionId: WRONG },
      T0 + 6000,
    );
    expect(() =>
      game.submitAnswer(
        emma.id,
        { questionIndex: 0, optionId: CORRECT },
        T0 + 7000,
      ),
    ).toThrow(expect.objectContaining({ code: "ALREADY_ANSWERED" }));
  });

  it("weigert een antwoord ruim na de tijd", () => {
    game.start(T0);
    game.openAnswers(T0 + 5000);
    const tooLate = game.endsAt + 2000;
    expect(() =>
      game.submitAnswer(
        emma.id,
        { questionIndex: 0, optionId: CORRECT },
        tooLate,
      ),
    ).toThrow(expect.objectContaining({ code: "TOO_LATE" }));
  });

  it("weet wanneer alle online spelers geantwoord hebben", () => {
    game.setConnected(emma.id, true);
    game.setConnected(sam.id, true);
    game.start(T0);
    game.openAnswers(T0 + 5000);
    game.submitAnswer(
      emma.id,
      { questionIndex: 0, optionId: CORRECT },
      T0 + 6000,
    );
    expect(game.allAnswered()).toBe(false);
    // Sam is weg: dan hoeft niemand op hem te wachten.
    game.setConnected(sam.id, false);
    expect(game.allAnswered()).toBe(true);
  });

  it("gaat na de laatste vraag naar het podium", () => {
    game.start(T0);
    game.next(T0); // leestijd overslaan
    game.next(T0); // vraag 1 stoppen
    game.next(T0); // vraag 2
    expect(game.questionIndex).toBe(1);
    expect(game.phase).toBe(PHASES.QUESTION_PREVIEW);
    game.next(T0);
    game.next(T0);
    game.next(T0); // laatste vraag was klaar
    expect(game.phase).toBe(PHASES.PODIUM);
    expect(game.getPlayerResult(emma.id)).toMatchObject({
      totalQuestions: 2,
      correctCount: 0,
    });
  });

  it("stuurt het goede antwoord nooit mee met de vraag", () => {
    game.start(T0);
    const payload = game.getQuestionPayload(T0);
    expect(payload.options.every((option) => !("isCorrect" in option))).toBe(
      true,
    );
  });

  it("zet bij restart ook de vraag-lus terug", () => {
    game.start(T0);
    game.next(T0);
    game.next(T0);
    game.next(T0);
    game.next(T0);
    game.next(T0);
    game.next(T0);
    game.restart();
    expect(game.questionIndex).toBe(-1);
    expect(() => game.start(T0)).not.toThrow();
  });
});

describe("Game: willekeurige quiz", () => {
  let game;
  const T0 = 1_000_000;

  beforeEach(() => {
    game = new Game("482913", { questionBank: QUESTION_BANK });
  });

  it("rekent het gemiddelde per vaardigheid uit, zonder bots", () => {
    // Lege lobby: nog niemand, dus null (en geen deling door 0).
    expect(game.getSkillAverage().SD).toBeNull();

    game.addPlayer("Emma", { skills: { SD: 0, AI: 5 } });
    game.addPlayer("Sam", { skills: { SD: 4 } });
    game.addPlayer("Testbot", { isBot: true, skills: { SD: 5 } });

    // SD: (0 + 4) / 2 = 2. AI: alleen Emma vulde het in. GD: niemand.
    expect(game.getSkillAverage()).toMatchObject({ SD: 2, AI: 5, GD: null });
  });

  it("laat de host het aantal vragen kiezen, alleen in de lobby", () => {
    expect(game.questionCount).toBe(DEFAULT_QUESTION_COUNT);
    expect(() => game.setQuestionCount(7)).toThrow(
      expect.objectContaining({ code: "INVALID_QUESTION_COUNT" }),
    );
    expect(() => game.setQuestionCount("5")).toThrow(
      expect.objectContaining({ code: "INVALID_QUESTION_COUNT" }),
    );

    game.setQuestionCount(5);
    game.addPlayer("Emma", { skills: { SD: 1 } });
    game.addPlayer("Sam", { skills: { SD: 3 } });
    game.start(T0);

    expect(game.totalQuestions).toBe(5);
    expect(
      // De antwoorden zijn gehusseld (nieuwe objecten), dus vergelijken op de tekst van de vraag.
      game.questions.every((question) =>
        QUESTION_BANK.some((bankQuestion) => bankQuestion.text === question.text),
      ),
    ).toBe(true);
    expect(() => game.setQuestionCount(10)).toThrow(
      expect.objectContaining({ code: "WRONG_PHASE" }),
    );
  });

  it("stuurt de vaardigheid en moeilijkheid van een vraag niet naar de spelers", () => {
    game.addPlayer("Emma");
    game.addPlayer("Sam");
    game.start(T0);
    const payload = game.getQuestionPayload(T0);
    expect(payload).not.toHaveProperty("skill");
    expect(payload).not.toHaveProperty("difficulty");
  });

  it("weigert een aantal vragen bij een quiz uit de database", () => {
    const normal = new Game("111111", { questions: QUIZ_QUESTIONS });
    expect(normal.questionCount).toBeNull();
    expect(() => normal.setQuestionCount(5)).toThrow(
      expect.objectContaining({ code: "NOT_RANDOM_QUIZ" }),
    );
  });
});

describe("Game: meerdere goede antwoorden en niveaus", () => {
  const T0 = 1_000_000;
  // Vraag met twee goede antwoorden (1 en 3), niveau 5, vaardigheid AI.
  const MULTI = {
    text: "Welke zijn programmeertalen?",
    timeLimitSec: 20,
    skill: "AI",
    difficulty: 5,
    options: [
      { id: 1, text: "Python", isCorrect: true },
      { id: 2, text: "HTML", isCorrect: false },
      { id: 3, text: "Java", isCorrect: true },
      { id: 4, text: "CSS", isCorrect: false },
    ],
  };
  let game, emma, sam, lisa;

  beforeEach(() => {
    game = new Game("777777", { questions: [MULTI], previewSeconds: 0 });
    emma = game.addPlayer("Emma");
    sam = game.addPlayer("Sam");
    lisa = game.addPlayer("Lisa");
    game.start(T0);
  });

  it("vertelt spelers dat er meerdere goede antwoorden zijn, maar niet welke of hoeveel", () => {
    const payload = game.getQuestionPayload(T0);
    expect(payload.multiple).toBe(true);
    expect(JSON.stringify(payload)).not.toMatch(/isCorrect/);
  });

  it("geeft alleen punten als je precies alle goede antwoorden kiest", () => {
    game.submitAnswer(emma.id, { questionIndex: 0, optionIds: [3, 1] }, T0); // allebei goed
    game.submitAnswer(sam.id, { questionIndex: 0, optionIds: [1] }, T0); // één vergeten
    game.submitAnswer(lisa.id, { questionIndex: 0, optionIds: [1, 2, 3] }, T0); // een foute erbij
    game.endQuestion();

    expect(game.getPlayer(emma.id).score).toBeGreaterThan(0);
    expect(game.getPlayer(sam.id).score).toBe(0);
    expect(game.getPlayer(lisa.id).score).toBe(0);
    expect(game.getQuestionEndPayload()).toMatchObject({
      correctOptionIds: [1, 3],
      correctPlayerCount: 1,
      answerCounts: { 1: 3, 2: 1, 3: 2, 4: 0 },
    });
    expect(game.getMyQuestionResult(emma.id)).toMatchObject({
      correct: true,
      optionIds: [1, 3],
    });
  });

  it("geeft meer punten voor een moeilijke vraag (niveau 5 = dubbel)", () => {
    game.submitAnswer(emma.id, { questionIndex: 0, optionIds: [1, 3] }, T0);
    game.endQuestion();
    expect(game.getPlayer(emma.id).score).toBe(2000);
  });

  it("laat vaardigheid en niveau pas na de vraag zien", () => {
    expect(game.getQuestionPayload(T0)).not.toHaveProperty("skill");
    game.endQuestion();
    expect(game.getQuestionEndPayload()).toMatchObject({
      skill: "AI",
      difficulty: 5,
    });
  });

  it("weigert dubbele, onbekende of lege keuzes", () => {
    for (const optionIds of [[1, 1], [9], []]) {
      expect(() =>
        game.submitAnswer(emma.id, { questionIndex: 0, optionIds }, T0),
      ).toThrow(expect.objectContaining({ code: "INVALID_OPTION" }));
    }
  });

  it("weigert meerdere antwoorden bij een gewone vraag", () => {
    const single = new Game("888888", {
      questions: QUIZ_QUESTIONS.slice(0, 1),
      previewSeconds: 0,
    });
    const a = single.addPlayer("Anna");
    single.addPlayer("Bram");
    single.start(T0);
    expect(single.getQuestionPayload(T0).multiple).toBe(false);
    expect(() =>
      single.submitAnswer(a.id, { questionIndex: 0, optionIds: [1, 2] }, T0),
    ).toThrow(expect.objectContaining({ code: "INVALID_OPTION" }));
  });

  it("onthoudt na verversen welke antwoorden je aanvinkte", () => {
    game.submitAnswer(emma.id, { questionIndex: 0, optionIds: [3, 1] }, T0);
    expect(game.getMyAnswer(emma.id)).toEqual([1, 3]);
  });
});

describe("Game: tijd stoppen (pauze)", () => {
  const T0 = 1_000_000;
  let game, emma;

  beforeEach(() => {
    game = new Game("999999", {
      questions: QUIZ_QUESTIONS.slice(0, 2),
      previewSeconds: 0,
    });
    emma = game.addPlayer("Emma");
    game.addPlayer("Sam"); // minimaal 2 spelers om te starten
    game.start(T0);
  });

  it("houdt de vraag op het scherm in plaats van naar de tussenstand te gaan", () => {
    game.pauseTimer(T0 + 5000);
    expect(game.phase).toBe(PHASES.QUESTION_ACTIVE);
    const payload = game.getQuestionPayload(T0 + 9000);
    expect(payload.paused).toBe(true);
    expect(payload.pausedMsLeft).toBe(15000); // 20 s - 5 s, ook als er later om gevraagd wordt
  });

  it("laat spelers nog antwoorden na de tijd, met de punten van het pauzemoment", () => {
    game.pauseTimer(T0 + 10000);
    // Ver na het einde van de tijd: met pauze geen TOO_LATE.
    game.submitAnswer(emma.id, { questionIndex: 0, optionId: 1 }, T0 + 60000);
    game.endQuestion();
    // Geantwoord "op 10 van 20 seconden": 750 punten, niet 500.
    expect(game.getPlayer(emma.id).score).toBe(750);
  });

  it("gaat pas met host:next naar de tussenstand", () => {
    game.pauseTimer(T0);
    game.next(T0 + 1000);
    expect(game.phase).toBe(PHASES.QUESTION_RESULT);
  });

  it("kan alleen tijdens een lopende vraag, en maar één keer", () => {
    game.pauseTimer(T0);
    expect(() => game.pauseTimer(T0)).toThrow(
      expect.objectContaining({ code: "WRONG_PHASE" }),
    );
    game.endQuestion();
    expect(() => game.pauseTimer(T0)).toThrow(
      expect.objectContaining({ code: "WRONG_PHASE" }),
    );
  });

  it("de volgende vraag begint weer met een lopende klok", () => {
    game.pauseTimer(T0);
    game.next(T0); // tussenstand
    game.next(T0); // vraag 2
    expect(game.paused).toBe(false);
    expect(game.getQuestionPayload(T0).paused).toBe(false);
  });
});

describe("Game: antwoorden in willekeurige volgorde", () => {
  it("shuffle houdt dezelfde items en laat het origineel heel", () => {
    const items = [1, 2, 3, 4];
    const result = shuffle(items, () => 0);
    expect(result).not.toBe(items);
    expect(items).toEqual([1, 2, 3, 4]);
    expect([...result].sort()).toEqual([1, 2, 3, 4]);
  });

  it("husselt de antwoorden bij de start, maar nakijken gaat nog op id", () => {
    const game = new Game("482913", { questions: QUIZ_QUESTIONS.slice(0, 1) });
    game.addPlayer("Emma");
    game.addPlayer("Sam");
    // random() = 0 schuift elk item naar voren: [1, 2, 3, 4] wordt [2, 3, 4, 1].
    game.start(0, () => 0);

    const ids = game.getQuestionPayload(0).options.map((option) => option.id);
    expect(ids).toEqual([2, 3, 4, 1]);
    // De vraag in quizQuestions.js zelf is niet veranderd.
    expect(QUIZ_QUESTIONS[0].options.map((option) => option.id)).toEqual([1, 2, 3, 4]);
    // Het goede antwoord heeft nog steeds hetzelfde id.
    const correct = game.currentQuestion.options.find((option) => option.isCorrect);
    expect(correct.text).toBe("HyperText Markup Language");
    expect(correct.id).toBe(1);
  });
});
