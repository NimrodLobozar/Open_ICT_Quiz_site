import { describe, expect, it } from "vitest";
import { QUESTION_BANK } from "../game/questionBank.js";
import {
  difficultyFor,
  pickWeighted,
  selectQuestions,
  skillWeight,
} from "../game/questionSelector.js";
import { SKILL_CODES } from "../../src/utils/skills.js";

// Een lobby waarin elke vaardigheid hetzelfde gemiddelde heeft, bijv. allSkills(5) = { SD: 5, AI: 5, ... }.
const allSkills = (average) =>
  Object.fromEntries(SKILL_CODES.map((code) => [code, average]));

describe("de vragenbank", () => {
  it("heeft per vaardigheid en per niveau (1 t/m 5) minstens 2 vragen", () => {
    for (const skill of SKILL_CODES) {
      for (const difficulty of [1, 2, 3, 4, 5]) {
        const found = QUESTION_BANK.filter(
          (question) =>
            question.skill === skill && question.difficulty === difficulty,
        );
        expect(
          found.length,
          `${skill}, moeilijkheid ${difficulty}`,
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("heeft alleen bekende vaardigheden en precies één goed antwoord per vraag", () => {
    for (const question of QUESTION_BANK) {
      expect(SKILL_CODES, question.text).toContain(question.skill);
      expect(
        question.options.filter((option) => option.isCorrect),
        question.text,
      ).toHaveLength(1);
    }
  });

  // Bug: bij zo'n 75% van de vragen was het langste antwoord het goede. Dan kun je raden zonder te lezen.
  // Bij 4 antwoorden is 1 op 4 (25%) toeval; daar mag de bank niet boven komen. Het kortste net zo.
  it("maakt het goede antwoord niet vaker het langste (of kortste) dan toeval", () => {
    const uniquely = (pick) =>
      QUESTION_BANK.filter((question) => {
        const lengths = question.options.map((option) => option.text.length);
        const target = pick(...lengths);
        const correct = question.options.find((option) => option.isCorrect);
        return (
          correct.text.length === target &&
          lengths.filter((length) => length === target).length === 1
        );
      }).length / QUESTION_BANK.length;
    expect(uniquely(Math.max)).toBeLessThanOrEqual(0.25);
    expect(uniquely(Math.min)).toBeLessThanOrEqual(0.25);
  });

  it("zet het goede antwoord niet steeds op dezelfde plek", () => {
    const perPlace = [0, 0, 0, 0];
    for (const question of QUESTION_BANK) {
      perPlace[question.options.findIndex((option) => option.isCorrect)] += 1;
    }
    for (const count of perPlace) {
      expect(count / QUESTION_BANK.length).toBeLessThanOrEqual(0.4);
    }
  });
});

describe("questionSelector", () => {
  it("koppelt een gemiddelde aan een niveau van 1 t/m 5", () => {
    expect(difficultyFor(0)).toBe(1);
    expect(difficultyFor(1.4)).toBe(1);
    expect(difficultyFor(1.5)).toBe(2);
    expect(difficultyFor(2.5)).toBe(3);
    expect(difficultyFor(3.6)).toBe(4);
    expect(difficultyFor(4.5)).toBe(5);
    expect(difficultyFor(5)).toBe(5);
    expect(difficultyFor(null)).toBe(3); // niemand vulde iets in
  });

  it("geeft de zwakste vaardigheid het hoogste gewicht, maar nooit 0", () => {
    expect(skillWeight(0)).toBe(6);
    expect(skillWeight(5)).toBe(1);
    expect(skillWeight(null)).toBe(3.5);
  });

  it("kiest met pickWeighted naar verhouding van het gewicht", () => {
    const weights = { a: 1, b: 3 }; // samen 4: a is het stuk 0–1 van de lat, b het stuk 1–4
    const weightOf = (item) => weights[item];
    expect(pickWeighted(["a", "b"], weightOf, () => 0.2)).toBe("a"); // 0.2 × 4 = 0.8 → in het stuk van a
    expect(pickWeighted(["a", "b"], weightOf, () => 0.3)).toBe("b"); // 0.3 × 4 = 1.2 → in het stuk van b
  });

  it("kiest precies het gevraagde aantal vragen, zonder dubbele", () => {
    const chosen = selectQuestions(QUESTION_BANK, allSkills(2.5), 10);
    expect(chosen).toHaveLength(10);
    expect(new Set(chosen).size).toBe(10);
  });

  it("geeft nooit meer vragen dan er in de bank staan", () => {
    expect(
      selectQuestions(QUESTION_BANK.slice(0, 3), allSkills(2.5), 10),
    ).toHaveLength(3);
  });

  it("kiest de moeilijkheid die bij het gemiddelde past, en anders de dichtstbijzijnde", () => {
    const sdOnly = QUESTION_BANK.filter((question) => question.skill === "SD");

    // Tel de vragen per niveau in plaats van een vast getal: zo blijft de test kloppen als er vragen bijkomen.
    const level1 = sdOnly.filter((question) => question.difficulty === 1).length;
    const level5 = sdOnly.filter((question) => question.difficulty === 5).length;

    // Beginners (0): eerst alle vragen van niveau 1, daarna is niveau 2 het dichtstbij.
    const beginners = selectQuestions(sdOnly, allSkills(0), level1 + 1);
    expect(beginners.map((question) => question.difficulty)).toEqual([...Array(level1).fill(1), 2]);

    // Experts (5): eerst alle vragen van niveau 5, daarna niveau 4.
    const experts = selectQuestions(sdOnly, allSkills(5), level5 + 1);
    expect(experts.map((question) => question.difficulty)).toEqual([...Array(level5).fill(5), 4]);
  });

  it("kiest vaker een vraag over de zwakste vaardigheid (1000 keer geprobeerd)", () => {
    const averages = { ...allSkills(5), GD: 0 }; // iedereen is goed in alles, behalve GD
    const counts = Object.fromEntries(SKILL_CODES.map((code) => [code, 0]));
    for (let i = 0; i < 1000; i++) {
      const [question] = selectQuestions(QUESTION_BANK, averages, 1);
      counts[question.skill] += 1;
    }
    // Gewichten: GD 6, de vijf andere elk 1. GD hoort dus ongeveer 6 van de 11 keer (± 545 keer) te komen.
    expect(counts.GD).toBeGreaterThan(450);
    for (const code of SKILL_CODES.filter((code) => code !== "GD")) {
      expect(counts[code]).toBeLessThan(counts.GD);
    }
  });
});
