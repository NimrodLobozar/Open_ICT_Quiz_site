import { beforeEach, describe, expect, it } from 'vitest'
import { Game } from '../game/Game.js'
import { PHASES } from '../game/phases.js'
import { QUIZ_QUESTIONS } from '../game/quizQuestions.js'

describe('Game', () => {
  let game

  beforeEach(() => {
    game = new Game('482913', { questions: QUIZ_QUESTIONS.slice(0, 3) })
  })

  it('weigert dezelfde naam met andere hoofdletters of spaties', () => {
    game.addPlayer('Nimród')
    expect(() => game.addPlayer('  NIMRÓD ')).toThrow(expect.objectContaining({ code: 'NAME_TAKEN' }))
  })

  it('weigert te korte, te lange en rare namen', () => {
    expect(() => game.addPlayer('A')).toThrow(expect.objectContaining({ code: 'NAME_INVALID' }))
    expect(() => game.addPlayer('x'.repeat(21))).toThrow(expect.objectContaining({ code: 'NAME_INVALID' }))
    expect(() => game.addPlayer('<script>')).toThrow(expect.objectContaining({ code: 'NAME_INVALID' }))
  })

  it('geeft de naam vrij als een speler vertrekt', () => {
    const sam = game.addPlayer('Sam')
    game.removePlayer(sam.id)
    expect(() => game.addPlayer('sam')).not.toThrow()
  })

  it('telt de totaalscore op uit de punten per vraag', () => {
    const emma = game.addPlayer('Emma')
    game.recordAnswer(emma.id, { questionIndex: 0, correct: true, points: 900 })
    game.recordAnswer(emma.id, { questionIndex: 1, correct: false, points: 0 })
    game.recordAnswer(emma.id, { questionIndex: 2, correct: true, points: 700 })
    expect(emma.score).toBe(emma.answers.reduce((sum, answer) => sum + answer.points, 0))
    expect(emma.correctCount).toBe(2)
  })

  it('zet bij finish de eindstand gelijk aan de laatste tussenstand', () => {
    const a = game.addPlayer('Anna')
    const b = game.addPlayer('Bram')
    game.recordAnswer(a.id, { questionIndex: 0, correct: true, points: 800 })
    game.recordAnswer(b.id, { questionIndex: 0, correct: true, points: 800 })
    const lastLeaderboard = game.getRanking()

    game.finish()

    expect(game.phase).toBe(PHASES.PODIUM)
    expect(game.finalRanking).toEqual(lastLeaderboard)
    expect(game.getPlayerResult(b.id)).toMatchObject({ rank: 1, playerCount: 2 })
  })

  it('houdt de eindstand gelijk als een speler na het podium vertrekt', () => {
    const a = game.addPlayer('Anna')
    const b = game.addPlayer('Bram')
    game.recordAnswer(a.id, { questionIndex: 0, correct: true, points: 800 })
    game.finish()
    game.removePlayer(a.id)
    expect(game.getPlayerResult(b.id)).toMatchObject({ rank: 2, playerCount: 2, pointsToNext: 800 })
  })

  it('laat geen nieuwe spelers toe na de start', () => {
    game.finish()
    expect(() => game.addPlayer('Laat')).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }))
  })

  it('houdt bij restart dezelfde spelers en namen, met score 0, in de lobby', () => {
    const emma = game.addPlayer('Emma')
    game.recordAnswer(emma.id, { questionIndex: 0, correct: true, points: 1000 })
    game.finish()

    game.restart()

    expect(game.phase).toBe(PHASES.LOBBY)
    expect(game.finalRanking).toBeNull()
    expect(game.getPlayer(emma.id)).toMatchObject({ nickname: 'Emma', score: 0, correctCount: 0, answers: [] })
  })
})

describe('Game: de vraag-lus', () => {
  let game
  let emma
  let sam
  const T0 = 1_000_000 // een vast "nu", zodat de tests niet van de echte klok afhangen

  beforeEach(() => {
    game = new Game('482913', { questions: QUIZ_QUESTIONS.slice(0, 2), previewSeconds: 5 })
    emma = game.addPlayer('Emma')
    sam = game.addPlayer('Sam')
  })

  // Vraag 1 van QUIZ_QUESTIONS: optie 1 (HTML) is goed.
  const CORRECT = 1
  const WRONG = 2

  it('start pas met minimaal 2 spelers', () => {
    const alone = new Game('111111')
    alone.addPlayer('Emma')
    expect(() => alone.start(T0)).toThrow(expect.objectContaining({ code: 'NOT_ENOUGH_PLAYERS' }))
    expect(alone.phase).toBe(PHASES.LOBBY)
  })

  it('weigert nieuwe spelers als de lobby op slot zit, en laat ze weer toe na openen', () => {
    game.setLocked(true)
    expect(() => game.addPlayer('Noah')).toThrow(expect.objectContaining({ code: 'LOBBY_LOCKED' }))
    expect(game.getPlayer(emma.id)).not.toBeNull()
    game.setLocked(false)
    expect(() => game.addPlayer('Noah')).not.toThrow()
    game.start(T0)
    expect(() => game.setLocked(true)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }))
  })

  it('laat de host alleen in de lobby spelers verwijderen', () => {
    game.addPlayer('Noah') // zodat er na het verwijderen nog 2 spelers zijn om te starten
    game.kickPlayer(emma.id)
    expect(game.getPlayer(emma.id)).toBeNull()
    game.start(T0)
    expect(() => game.kickPlayer(sam.id)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }))
    expect(game.getPlayer(sam.id)).not.toBeNull()
  })

  it('begint met leestijd en opent daarna de antwoorden', () => {
    game.start(T0)
    expect(game.phase).toBe(PHASES.QUESTION_PREVIEW)
    expect(game.startsAt).toBe(T0 + 5000)
    expect(() => game.submitAnswer(emma.id, { questionIndex: 0, optionId: CORRECT }, T0 + 1000)).toThrow(
      expect.objectContaining({ code: 'WRONG_PHASE' }),
    )

    game.openAnswers(T0 + 5000)
    expect(game.phase).toBe(PHASES.QUESTION_ACTIVE)
  })

  it('laat de tijd nu beginnen als de host de leestijd overslaat', () => {
    game.start(T0)
    game.next(T0 + 2000)
    expect(game.phase).toBe(PHASES.QUESTION_ACTIVE)
    expect(game.startsAt).toBe(T0 + 2000)
  })

  it('geeft meer punten voor sneller antwoorden, en 0 voor fout of geen antwoord', () => {
    const lisa = game.addPlayer('Lisa')
    game.start(T0)
    game.openAnswers(T0 + 5000)
    game.submitAnswer(emma.id, { questionIndex: 0, optionId: CORRECT }, T0 + 5000) // direct
    game.submitAnswer(sam.id, { questionIndex: 0, optionId: WRONG }, T0 + 6000)
    game.endQuestion()

    expect(game.phase).toBe(PHASES.QUESTION_RESULT)
    expect(game.getPlayer(emma.id).score).toBe(1000)
    expect(game.getPlayer(sam.id).score).toBe(0)
    expect(game.getMyQuestionResult(lisa.id)).toMatchObject({ answered: false, correct: false, pointsGained: 0 })
    expect(game.getQuestionEndPayload()).toMatchObject({
      correctOptionId: CORRECT,
      answerCounts: { 1: 1, 2: 1, 3: 0, 4: 0 },
    })
  })

  it('telt maar één antwoord per speler', () => {
    game.start(T0)
    game.openAnswers(T0 + 5000)
    game.submitAnswer(emma.id, { questionIndex: 0, optionId: WRONG }, T0 + 6000)
    expect(() => game.submitAnswer(emma.id, { questionIndex: 0, optionId: CORRECT }, T0 + 7000)).toThrow(
      expect.objectContaining({ code: 'ALREADY_ANSWERED' }),
    )
  })

  it('weigert een antwoord ruim na de tijd', () => {
    game.start(T0)
    game.openAnswers(T0 + 5000)
    const tooLate = game.endsAt + 2000
    expect(() => game.submitAnswer(emma.id, { questionIndex: 0, optionId: CORRECT }, tooLate)).toThrow(
      expect.objectContaining({ code: 'TOO_LATE' }),
    )
  })

  it('weet wanneer alle online spelers geantwoord hebben', () => {
    game.setConnected(emma.id, true)
    game.setConnected(sam.id, true)
    game.start(T0)
    game.openAnswers(T0 + 5000)
    game.submitAnswer(emma.id, { questionIndex: 0, optionId: CORRECT }, T0 + 6000)
    expect(game.allAnswered()).toBe(false)
    // Sam is weg: dan hoeft niemand op hem te wachten.
    game.setConnected(sam.id, false)
    expect(game.allAnswered()).toBe(true)
  })

  it('gaat na de laatste vraag naar het podium', () => {
    game.start(T0)
    game.next(T0) // leestijd overslaan
    game.next(T0) // vraag 1 stoppen
    game.next(T0) // vraag 2
    expect(game.questionIndex).toBe(1)
    expect(game.phase).toBe(PHASES.QUESTION_PREVIEW)
    game.next(T0)
    game.next(T0)
    game.next(T0) // laatste vraag was klaar
    expect(game.phase).toBe(PHASES.PODIUM)
    expect(game.getPlayerResult(emma.id)).toMatchObject({ totalQuestions: 2, correctCount: 0 })
  })

  it('stuurt het goede antwoord nooit mee met de vraag', () => {
    game.start(T0)
    const payload = game.getQuestionPayload(T0)
    expect(payload.options.every((option) => !('isCorrect' in option))).toBe(true)
  })

  it('zet bij restart ook de vraag-lus terug', () => {
    game.start(T0)
    game.next(T0)
    game.next(T0)
    game.next(T0)
    game.next(T0)
    game.next(T0)
    game.next(T0)
    game.restart()
    expect(game.questionIndex).toBe(-1)
    expect(() => game.start(T0)).not.toThrow()
  })
})
