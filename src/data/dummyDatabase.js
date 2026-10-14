// Dummy "database" voor het eindscherm.
// Er is nog geen server of echte database, dus deze data staat tijdelijk in de frontend.
// De vorm volgt de Prisma-tabellen uit het projectplan (hoofdstuk 12: User, GameSession, GameResult),
// zodat we dit bestand later makkelijk kunnen vervangen door echte API-calls.
// TODO(team): vervangen door data van de server zodra de database en de API er zijn.

// Spelers mét account (later: login). Hun scores blijven bewaard.
export const users = [
  { id: 1, email: 'sanne@student.hu.nl', displayName: 'Sanne' },
  { id: 2, email: 'daan@student.hu.nl', displayName: 'Daan' },
  { id: 3, email: 'fatima@student.hu.nl', displayName: 'Fatima' },
  { id: 4, email: 'lucas@student.hu.nl', displayName: 'Lucas' },
  { id: 5, email: 'noah@student.hu.nl', displayName: 'Noah' },
]

// Eén gespeelde quiz (lobby met code 482913, 8 vragen).
export const gameSessions = [
  {
    id: 1,
    code: '482913',
    quizId: 1,
    round: 1,
    totalQuestions: 8,
    startedAt: '2026-10-07T10:00:00.000Z',
    endedAt: '2026-10-07T10:12:00.000Z',
  },
]

// Scores per speler in die game.
// userId = null betekent: gast zonder account. Die scores worden later aan het eind van de quiz gewist.
// Er staat bewust géén rank in: het eindscherm sorteert zelf op score.
// Let op: Fatima en Mo hebben dezelfde score, zo kun je testen dat gelijke scores dezelfde plek krijgen.
export const gameResults = [
  { id: 1, sessionId: 1, nickname: 'Sanne', userId: 1, score: 7420, correctCount: 8 },
  { id: 2, sessionId: 1, nickname: 'Daan', userId: 2, score: 5310, correctCount: 6 },
  { id: 3, sessionId: 1, nickname: 'Fatima', userId: 3, score: 6150, correctCount: 7 },
  { id: 4, sessionId: 1, nickname: 'Lucas', userId: 4, score: 2890, correctCount: 4 },
  { id: 5, sessionId: 1, nickname: 'Noah', userId: 5, score: 4480, correctCount: 5 },
  { id: 6, sessionId: 1, nickname: 'Mo', userId: null, score: 6150, correctCount: 7 },
  { id: 7, sessionId: 1, nickname: 'Emma', userId: null, score: 3720, correctCount: 5 },
  { id: 8, sessionId: 1, nickname: 'quizkoning', userId: null, score: 1540, correctCount: 2 },
  { id: 9, sessionId: 1, nickname: 'Yara', userId: null, score: 5880, correctCount: 7 },
  { id: 10, sessionId: 1, nickname: 'Tim_04', userId: null, score: 0, correctCount: 0 },
]

// De 8 vragen van quiz 1, in de vorm van de tabellen Question en AnswerOption (projectplan 12).
// Voor de demo's van het vraagscherm (/question en /question-answers).
// isCorrect staat hier wel in, maar gaat nooit mee naar het scherm: zie getDemoQuestion.
export const questions = [
  { id: 1, quizId: 1, order: 1, timeLimitSec: 20, text: 'Waar staat de afkorting HTML voor?' },
  { id: 2, quizId: 1, order: 2, timeLimitSec: 20, text: 'Welke van deze talen draait standaard in de browser?' },
  { id: 3, quizId: 1, order: 3, timeLimitSec: 20, text: 'Welke HTTP-statuscode betekent dat een pagina niet gevonden is?' },
  { id: 4, quizId: 1, order: 4, timeLimitSec: 20, text: 'Wat doet git commit?' },
  { id: 5, quizId: 1, order: 5, timeLimitSec: 20, text: 'Welke SQL-opdracht haalt rijen op uit een tabel?' },
  { id: 6, quizId: 1, order: 6, timeLimitSec: 20, text: 'Hoeveel bits zitten er in één byte?' },
  { id: 7, quizId: 1, order: 7, timeLimitSec: 20, text: 'Wat is phishing?' },
  { id: 8, quizId: 1, order: 8, timeLimitSec: 20, text: 'Waar staat de afkorting AI voor?' },
]

export const answerOptions = [
  { id: 1, questionId: 1, order: 1, text: 'HyperText Markup Language', isCorrect: true },
  { id: 2, questionId: 1, order: 2, text: 'High Tech Modern Language', isCorrect: false },
  { id: 3, questionId: 1, order: 3, text: 'Home Tool Markup Language', isCorrect: false },
  { id: 4, questionId: 1, order: 4, text: 'Hyperlink Text Mode Layout', isCorrect: false },
  { id: 5, questionId: 2, order: 1, text: 'Python', isCorrect: false },
  { id: 6, questionId: 2, order: 2, text: 'JavaScript', isCorrect: true },
  { id: 7, questionId: 2, order: 3, text: 'C#', isCorrect: false },
  { id: 8, questionId: 2, order: 4, text: 'PHP', isCorrect: false },
  { id: 9, questionId: 3, order: 1, text: '200', isCorrect: false },
  { id: 10, questionId: 3, order: 2, text: '301', isCorrect: false },
  { id: 11, questionId: 3, order: 3, text: '404', isCorrect: true },
  { id: 12, questionId: 3, order: 4, text: '500', isCorrect: false },
  { id: 13, questionId: 4, order: 1, text: 'Code naar GitHub sturen', isCorrect: false },
  { id: 14, questionId: 4, order: 2, text: 'Wijzigingen lokaal vastleggen', isCorrect: true },
  { id: 15, questionId: 4, order: 3, text: 'Een nieuwe branch maken', isCorrect: false },
  { id: 16, questionId: 4, order: 4, text: 'Twee branches samenvoegen', isCorrect: false },
  { id: 17, questionId: 5, order: 1, text: 'GET', isCorrect: false },
  { id: 18, questionId: 5, order: 2, text: 'SELECT', isCorrect: true },
  { id: 19, questionId: 5, order: 3, text: 'FETCH', isCorrect: false },
  { id: 20, questionId: 5, order: 4, text: 'PULL', isCorrect: false },
  { id: 21, questionId: 6, order: 1, text: '4', isCorrect: false },
  { id: 22, questionId: 6, order: 2, text: '8', isCorrect: true },
  { id: 23, questionId: 6, order: 3, text: '16', isCorrect: false },
  { id: 24, questionId: 6, order: 4, text: '32', isCorrect: false },
  { id: 25, questionId: 7, order: 1, text: 'Een soort firewall', isCorrect: false },
  { id: 26, questionId: 7, order: 2, text: 'Een programmeertaal', isCorrect: false },
  { id: 27, questionId: 7, order: 3, text: 'Nepberichten om gegevens te stelen', isCorrect: true },
  { id: 28, questionId: 7, order: 4, text: 'Een back-upmethode', isCorrect: false },
  { id: 29, questionId: 8, order: 1, text: 'Automatische Invoer', isCorrect: false },
  { id: 30, questionId: 8, order: 2, text: 'Artificial Intelligence', isCorrect: true },
  { id: 31, questionId: 8, order: 3, text: 'Advanced Internet', isCorrect: false },
  { id: 32, questionId: 8, order: 4, text: 'Analoge Informatica', isCorrect: false },
]
