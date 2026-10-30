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
  it("heeft per vaardigheid en per moeilijkheid minstens 2 vragen", () => {
    for (const skill of SKILL_CODES) {
      for (const difficulty of [1, 2, 3]) {
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
});

describe("questionSelector", () => {
  it("koppelt een gemiddelde aan een moeilijkheid", () => {
    expect(difficultyFor(0)).toBe(1);
    expect(difficultyFor(1.6)).toBe(1);
    expect(difficultyFor(1.7)).toBe(2);
    expect(difficultyFor(3.3)).toBe(2);
    expect(difficultyFor(3.4)).toBe(3);
    expect(difficultyFor(5)).toBe(3);
    expect(difficultyFor(null)).toBe(2); // niemand vulde iets in
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

    // Beginners (0): eerst de 2 makkelijke SD-vragen, daarna is "gemiddeld" het dichtstbij.
    const beginners = selectQuestions(sdOnly, allSkills(0), 3);
    expect(beginners.map((question) => question.difficulty)).toEqual([1, 1, 2]);

    // Experts (5): de 2 moeilijke vragen.
    const experts = selectQuestions(sdOnly, allSkills(5), 2);
    expect(experts.map((question) => question.difficulty)).toEqual([3, 3]);
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
