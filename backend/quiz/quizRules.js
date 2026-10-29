import { ApiError } from '../utils/ApiError.js'

// Regels voor quizzen (story 7 en 8). Zonder database, zodat ze makkelijk te testen zijn.

// Keuzes voor "Tijd per vraag", zoals in het design (Admin · mijn account).
export const TIME_OPTIONS = [10, 20, 30, 60]

export const DEFAULT_QUIZ_SETTINGS = {
  timePerQuestion: 20,
  showCorrectAnswer: true,
  showStandings: true,
  lockLobbyOnStart: false,
}

export const LIMITS = { title: 100, questions: 50, questionText: 200, optionText: 100, minOptions: 2, maxOptions: 4 }

/**
 * Standaardinstellingen van een docent, gecontroleerd. Onbekende of foute waarden worden de systeemstandaard.
 * @returns {typeof DEFAULT_QUIZ_SETTINGS}
 */
export function cleanQuizDefaults(raw) {
  const value = raw && typeof raw === 'object' ? raw : {}
  return {
    timePerQuestion: TIME_OPTIONS.includes(value.timePerQuestion)
      ? value.timePerQuestion
      : DEFAULT_QUIZ_SETTINGS.timePerQuestion,
    showCorrectAnswer: bool(value.showCorrectAnswer, DEFAULT_QUIZ_SETTINGS.showCorrectAnswer),
    showStandings: bool(value.showStandings, DEFAULT_QUIZ_SETTINGS.showStandings),
    lockLobbyOnStart: bool(value.lockLobbyOnStart, DEFAULT_QUIZ_SETTINGS.lockLobbyOnStart),
  }
}

const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback)

/**
 * Story 8: een nieuwe quiz neemt de standaardinstellingen van de docent over.
 * Alles wat de docent bij deze quiz zelf heeft ingevuld, wint; wat leeg is (undefined), komt uit `defaults`.
 * @param {typeof DEFAULT_QUIZ_SETTINGS} defaults de standaard van de docent (al gecontroleerd door cleanQuizDefaults)
 * @param {Partial<typeof DEFAULT_QUIZ_SETTINGS>} settings wat de docent bij deze quiz koos; ontbrekende velden zijn undefined
 * @returns {typeof DEFAULT_QUIZ_SETTINGS}
 */
export function applyQuizDefaults(defaults, settings) {
  return {
    timePerQuestion: settings.timePerQuestion ?? defaults.timePerQuestion,
    showCorrectAnswer: settings.showCorrectAnswer ?? defaults.showCorrectAnswer,
    showStandings: settings.showStandings ?? defaults.showStandings,
    lockLobbyOnStart: settings.lockLobbyOnStart ?? defaults.lockLobbyOnStart,
  }
}

/**
 * Story 7: mag deze quiz gehost worden? Gooit een ApiError als het niet mag.
 * @param {{ status: 'DRAFT' | 'READY', questions: Array<unknown> }} quiz
 */
export function assertCanHost(quiz) {
  if (quiz.status !== 'READY') {
    throw new ApiError('QUIZ_DRAFT', 'Deze quiz is nog een concept. Zet hem eerst op "Klaar".', 409)
  }
  if (quiz.questions.length === 0) {
    throw new ApiError('QUIZ_EMPTY', 'Deze quiz heeft nog geen vragen.', 409)
  }
}

/**
 * Controleert wat de quiz-editor stuurt. Geeft een schone kopie terug, of gooit een ApiError met een duidelijke melding.
 * Instellingen die de editor niet meestuurt, blijven undefined (applyQuizDefaults vult ze aan).
 */
export function parseQuizInput(body) {
  const input = body && typeof body === 'object' ? body : {}

  const title = typeof input.title === 'string' ? input.title.trim() : ''
  if (!title || title.length > LIMITS.title) fail(`Geef de quiz een titel (maximaal ${LIMITS.title} tekens).`)

  const status = input.status ?? 'DRAFT'
  if (!['DRAFT', 'READY'].includes(status)) fail('Status moet "concept" of "klaar" zijn.')

  const rawQuestions = input.questions ?? []
  if (!Array.isArray(rawQuestions) || rawQuestions.length > LIMITS.questions) {
    fail(`Een quiz heeft maximaal ${LIMITS.questions} vragen.`)
  }
  if (status === 'READY' && rawQuestions.length === 0) fail('Een quiz die klaar is, heeft minstens één vraag.')

  const settings = {}
  if (input.timePerQuestion !== undefined) {
    if (!TIME_OPTIONS.includes(input.timePerQuestion)) fail('Kies een geldige tijd per vraag.')
    settings.timePerQuestion = input.timePerQuestion
  }
  for (const key of ['showCorrectAnswer', 'showStandings', 'lockLobbyOnStart']) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'boolean') fail('Ongeldige instelling.')
      settings[key] = input[key]
    }
  }

  const questions = rawQuestions.map((question, index) => parseQuestion(question, index + 1))
  return { title, status, settings, questions }
}

function parseQuestion(raw, number) {
  const question = raw && typeof raw === 'object' ? raw : {}
  const text = typeof question.text === 'string' ? question.text.trim() : ''
  if (!text || text.length > LIMITS.questionText) fail(`Vraag ${number}: vul de vraag in (maximaal ${LIMITS.questionText} tekens).`)

  let timeLimitSec
  if (question.timeLimitSec !== undefined && question.timeLimitSec !== null) {
    if (!Number.isInteger(question.timeLimitSec) || question.timeLimitSec < 5 || question.timeLimitSec > 120) {
      fail(`Vraag ${number}: de tijd moet tussen 5 en 120 seconden zijn.`)
    }
    timeLimitSec = question.timeLimitSec
  }

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length < LIMITS.minOptions || options.length > LIMITS.maxOptions) {
    fail(`Vraag ${number}: geef ${LIMITS.minOptions} tot ${LIMITS.maxOptions} antwoorden.`)
  }
  const cleanOptions = options.map((option) => {
    const optionText = typeof option?.text === 'string' ? option.text.trim() : ''
    if (!optionText || optionText.length > LIMITS.optionText) {
      fail(`Vraag ${number}: elk antwoord heeft tekst nodig (maximaal ${LIMITS.optionText} tekens).`)
    }
    return { text: optionText, isCorrect: option.isCorrect === true }
  })
  if (cleanOptions.filter((option) => option.isCorrect).length !== 1) {
    fail(`Vraag ${number}: kies precies één goed antwoord.`)
  }
  return { text, timeLimitSec, options: cleanOptions }
}

function fail(message) {
  throw new ApiError('QUIZ_INVALID', message, 400)
}
