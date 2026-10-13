import { answerOptions, questions } from "../../data/dummyDatabase.js";

/**
 * Een vraag uit de nepdata, in precies de vorm van het event question:show (projectplan 8.2).
 * Zo werken de schermen straks zonder aanpassingen met de echte server.
 * @param {number} index  vanaf 0
 * @param {{ startsAt: number, previewSeconds: number }} timing
 *   startsAt = het moment dat de antwoorden verschijnen en het aftellen begint.
 */
export function getDemoQuestion(index, { startsAt, previewSeconds }) {
  const question = questions[index];
  if (!question) return null;
  return {
    index,
    total: questions.length,
    text: question.text,
    // Alleen id en text: isCorrect gaat nooit mee voordat de vraag voorbij is,
    // anders kan een speler het goede antwoord in DevTools opzoeken (projectplan 7).
    options: answerOptions
      .filter((option) => option.questionId === question.id)
      .sort((a, b) => a.order - b.order)
      .map(({ id, text }) => ({ id, text })),
    timeLimitSec: question.timeLimitSec,
    previewSeconds,
    startsAt,
  };
}

/** ?vraag=3 in de adresbalk → index 2. Ongeldig of leeg → de eerste vraag. */
export function demoIndexFromSearch(searchParams) {
  const nr = Number(searchParams.get("vraag"));
  return Number.isInteger(nr) && nr >= 1 && nr <= questions.length
    ? nr - 1
    : 0;
}
