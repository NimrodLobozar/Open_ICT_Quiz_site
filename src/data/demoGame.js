// Nepgame voor de demo's van de vraag- en tussenstandschermen (host én speler).
// Er is nog geen game loop op de server (projectplan fase 4), dus hier rekenen we een game na.
// Alles is vast (geen Math.random): elke keer dat je de demo opent, zie je dezelfde getallen,
// en de host-demo en de speler-demo zijn het met elkaar eens.
// TODO(team, fase 4): weg zodra de server question:show, question:end en leaderboard:show stuurt.
import { getRanking } from '../utils/ranking.js'
import { calculatePoints } from '../utils/scoring.js'
import { answerOptions, gameResults, gameSessions, questions } from './dummyDatabase.js'

export const DEMO_CODE = gameSessions[0].code
// Emma is "jij" in de speler-demo's, net als op /end-player.
export const DEMO_PLAYER_ID = 7

const players = gameResults.map(({ id, nickname, userId }) => ({ id, nickname, isVerified: userId !== null }))

/**
 * Een vraag in precies de vorm van het event question:show (projectplan 8.2).
 * Zo werken de schermen straks zonder aanpassingen met de echte server.
 * @param {number} index  vanaf 0
 * @param {{ startsAt: number, previewSeconds: number }} timing
 *   startsAt = het moment dat de antwoorden verschijnen en het aftellen begint.
 */
export function getDemoQuestion(index, { startsAt, previewSeconds }) {
  const question = questions[index]
  if (!question) return null
  return {
    index,
    total: questions.length,
    text: question.text,
    // Alleen id en text: isCorrect gaat nooit mee voordat de vraag voorbij is,
    // anders kan een speler het goede antwoord in DevTools opzoeken (projectplan 7).
    options: getOptions(question.id).map(({ id, text }) => ({ id, text })),
    timeLimitSec: question.timeLimitSec,
    previewSeconds,
    startsAt,
  }
}

/** ?vraag=3 in de adresbalk → index 2. Ongeldig of leeg → de eerste vraag. */
export function demoIndexFromSearch(searchParams) {
  const nr = Number(searchParams.get('vraag'))
  return Number.isInteger(nr) && nr >= 1 && nr <= questions.length ? nr - 1 : 0
}

/**
 * Punten met dezelfde formule als de server (src/utils/scoring.js).
 * In het echt rekent de server dit uit (de client kan liegen over zijn tijd).
 */
export function demoPoints(correct, responseMs, timeLimitSec) {
  return calculatePoints({ correct, responseMs, timeLimitSec })
}

export function isDemoOptionCorrect(optionId) {
  return answerOptions.find((option) => option.id === optionId)?.isCorrect ?? false
}

/**
 * Hoe vraag `index` afliep, plus de stand daarna.
 * @param {number} index  vanaf 0
 * @param {{ myAnswer?: { optionId: number | null, points: number } }} [options]
 *   myAnswer = wat "jij" (Emma) in de speler-demo echt klikte. Zonder: Emma's vaste nep-antwoord.
 * @returns {{ correctOptionId: number, answerCounts: Record<number, number>, ranking: Array<RankingRow> }}
 *   correctOptionId en answerCounts in de vorm van question:end.
 *   ranking komt uit getRanking(), met per speler ook pointsGained voor deze vraag.
 */
export function getDemoRound(index, { myAnswer } = {}) {
  const question = questions[index]
  const options = getOptions(question.id)
  const correctOptionId = options.find((option) => option.isCorrect).id
  const answerCounts = Object.fromEntries(options.map((option) => [option.id, 0]))

  const rows = players.map((player) => {
    // Eerst alle vorige vragen optellen, dan deze vraag.
    let score = 0
    let correctCount = 0
    for (let q = 0; q < index; q += 1) {
      const answer = fakeAnswer(player.id, q)
      score += answer.points
      if (answer.correct) correctCount += 1
    }

    const answer = player.id === DEMO_PLAYER_ID && myAnswer ? myAnswer : fakeAnswer(player.id, index)
    // "in": een antwoord-id van een andere vraag telt niet mee.
    if (answer.optionId in answerCounts) answerCounts[answer.optionId] += 1
    const correct = answer.optionId === correctOptionId
    return {
      ...player,
      score: score + answer.points,
      correctCount: correctCount + (correct ? 1 : 0),
      pointsGained: answer.points,
      answered: answer.optionId != null,
      correct,
    }
  })

  return { correctOptionId, answerCounts, ranking: getRanking(rows) }
}

/** Score van één speler vóór vraag `index` (voor "Emma · 940 punten" onder de vraag). */
export function getDemoScoreBefore(playerId, index) {
  if (index === 0) return 0
  return getDemoRound(index - 1).ranking.find((row) => row.id === playerId)?.score ?? 0
}

function getOptions(questionId) {
  return answerOptions.filter((option) => option.questionId === questionId).sort((a, b) => a.order - b.order)
}

// Vaste "willekeur" per speler en vraag: zo krijgt iedereen een ander, maar steeds hetzelfde antwoord.
function fakeAnswer(playerId, index) {
  const options = getOptions(questions[index].id)
  const correctOption = options.find((option) => option.isCorrect)
  const wrongOptions = options.filter((option) => !option.isCorrect)
  const seed = playerId * 7 + index * 3

  // Speler 8 vergeet af en toe te antwoorden, Tim_04 (10) zit altijd fout, verder 1 op de 4 fout.
  if (playerId === 8 && index % 2 === 1) return { optionId: null, points: 0 }
  if (playerId === 10 || seed % 4 === 0) {
    return { optionId: wrongOptions[seed % wrongOptions.length].id, points: 0 }
  }
  // Snelheid tussen 0 en 90% van de tijd → 550 tot 1000 punten.
  const responseMs = ((seed * 13) % 10) * 0.1 * questions[index].timeLimitSec * 1000
  return { optionId: correctOption.id, points: demoPoints(true, responseMs, questions[index].timeLimitSec) }
}

/**
 * @typedef {{ id: number, nickname: string, isVerified: boolean, score: number, correctCount: number,
 *   pointsGained: number, answered: boolean, correct: boolean, rank: number }} RankingRow
 */
