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
