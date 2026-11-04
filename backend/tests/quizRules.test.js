import { describe, expect, it } from 'vitest'
import {
  applyQuizDefaults,
  assertCanHost,
  cleanQuizDefaults,
  DEFAULT_QUIZ_SETTINGS,
  parseQuizInput,
} from '../quiz/quizRules.js'

const question = { text: 'V', options: [{ text: 'a', isCorrect: true }, { text: 'b' }] }

// USER IMPLEMENTATION S7 — backend/quiz/quizRules.js (assertCanHost)
describe('mag deze quiz gehost worden? (S7)', () => {
  it('een quiz die klaar is en vragen heeft: ja', () => {
    expect(() => assertCanHost({ status: 'READY', questions: [question] })).not.toThrow()
  })

  it('een concept-quiz: nee, met code QUIZ_DRAFT en status 409', () => {
    expect(() => assertCanHost({ status: 'DRAFT', questions: [question] })).toThrow(
      expect.objectContaining({ code: 'QUIZ_DRAFT', status: 409 }),
    )
  })

  it('een quiz zonder vragen: nee', () => {
    expect(() => assertCanHost({ status: 'READY', questions: [] })).toThrow(
      expect.objectContaining({ code: 'QUIZ_EMPTY' }),
    )
  })
})

// USER IMPLEMENTATION S8 — backend/quiz/quizRules.js (applyQuizDefaults)
describe('standaardinstellingen overnemen (S8)', () => {
  const defaults = { timePerQuestion: 30, showCorrectAnswer: false, showStandings: false, lockLobbyOnStart: true }

  it('niets ingevuld bij de quiz: alles uit de standaard van de docent', () => {
    expect(applyQuizDefaults(defaults, {})).toEqual(defaults)
  })

  it('wat de docent bij de quiz koos, wint', () => {
    expect(applyQuizDefaults(defaults, { timePerQuestion: 10, showStandings: true })).toEqual({
      timePerQuestion: 10,
      showCorrectAnswer: false,
      showStandings: true,
      lockLobbyOnStart: true,
    })
  })

  it('false is een keuze, geen "leeg": die wint ook', () => {
    expect(applyQuizDefaults(DEFAULT_QUIZ_SETTINGS, { showCorrectAnswer: false }).showCorrectAnswer).toBe(false)
  })
})

describe('quiz-invoer controleren', () => {
  it('maakt een schone kopie en laat niet-ingevulde instellingen leeg', () => {
    const input = parseQuizInput({ title: '  Git  ', status: 'READY', questions: [question], hack: 1 })
    expect(input).toEqual({
      title: 'Git',
      status: 'READY',
      settings: {},
      questions: [
        {
          text: 'V',
          timeLimitSec: undefined,
          skill: null,
          difficulty: null,
          options: [
            { text: 'a', isCorrect: true },
            { text: 'b', isCorrect: false },
          ],
        },
      ],
    })
  })

  it('meer dan één goed antwoord mag, maar niet alles goed of niets goed', () => {
    const two = { text: 'V', options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: true }, { text: 'c' }] }
    expect(parseQuizInput({ title: 'Q', questions: [two] }).questions[0].options.filter((o) => o.isCorrect)).toHaveLength(2)
    const all = { text: 'V', options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: true }] }
    expect(() => parseQuizInput({ title: 'Q', questions: [all] })).toThrow(/fout antwoord/)
    const none = { text: 'V', options: [{ text: 'a' }, { text: 'b' }] }
    expect(() => parseQuizInput({ title: 'Q', questions: [none] })).toThrow(/minstens één goed/)
  })

  it('vaardigheid en niveau (1 t/m 5) zijn optioneel, maar moeten geldig zijn', () => {
    const ok = parseQuizInput({ title: 'Q', questions: [{ ...question, skill: 'AI', difficulty: 5 }] })
    expect(ok.questions[0]).toMatchObject({ skill: 'AI', difficulty: 5 })
    expect(() => parseQuizInput({ title: 'Q', questions: [{ ...question, skill: 'XX' }] })).toThrow(/vaardigheid/)
    expect(() => parseQuizInput({ title: 'Q', questions: [{ ...question, difficulty: 6 }] })).toThrow(/niveau/)
    expect(() => parseQuizInput({ title: 'Q', questions: [{ ...question, difficulty: 0 }] })).toThrow(/niveau/)
  })

  it('cleanQuizDefaults maakt van onzin de systeemstandaard', () => {
    expect(cleanQuizDefaults({ timePerQuestion: 7, showStandings: 'ja' })).toEqual(DEFAULT_QUIZ_SETTINGS)
    expect(cleanQuizDefaults(null)).toEqual(DEFAULT_QUIZ_SETTINGS)
  })
})
