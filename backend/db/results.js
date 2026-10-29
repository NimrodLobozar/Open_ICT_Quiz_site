import { summarizeResults } from '../results/summary.js'
import { ApiError } from '../utils/ApiError.js'
import { prisma } from './prisma.js'

export const ROUNDS_PER_PAGE = 20
const RECENT_LIMIT = 5

/**
 * Story 4: de resultaten van één speler. Altijd op userId van de ingelogde gebruiker,
 * nooit op een id uit de URL: zo kan niemand de resultaten van een ander opvragen.
 * @param {{ all?: boolean }} options all = alle rondes in plaats van de laatste 5 ("Alle uitslagen")
 */
export async function getMyResults(userId, { all = false } = {}) {
  const rows = await prisma.gameResult.findMany({
    where: { userId },
    orderBy: { session: { endedAt: 'desc' } },
    select: {
      id: true,
      rank: true,
      score: true,
      correctCount: true,
      session: {
        select: { quizTitle: true, endedAt: true, questionCount: true, _count: { select: { results: true } } },
      },
    },
  })

  const summary = summarizeResults(
    rows.map((row) => ({ rank: row.rank, correctCount: row.correctCount, questionCount: row.session.questionCount })),
  )
  const list = all ? rows : rows.slice(0, RECENT_LIMIT)
  return {
    summary,
    total: rows.length,
    results: list.map((row) => ({
      id: row.id,
      rank: row.rank,
      score: row.score,
      correctCount: row.correctCount,
      questionCount: row.session.questionCount,
      quizTitle: row.session.quizTitle ?? 'Open ICT Quiz',
      playedAt: row.session.endedAt,
      playerCount: row.session._count.results,
    })),
  }
}

// Een docent ziet de rondes van zijn eigen quizzen, een beheerder alles (ook rondes van vóór de Quiz-tabel).
const visibleRounds = (user) => (user.role === 'ADMIN' ? {} : { quiz: { ownerId: user.id } })

/** De pagina "Uitslagen": gespeelde rondes, nieuwste eerst, met zoeken op quiztitel of code. */
export async function listRounds(user, { q = '', page = 1 }) {
  const search = q
    ? { OR: [{ quizTitle: { contains: q, mode: 'insensitive' } }, { code: { contains: q } }] }
    : {}
  const where = { AND: [visibleRounds(user), search] }

  const [total, rounds, players, withAccount] = await prisma.$transaction([
    prisma.gameSession.count({ where }),
    prisma.gameSession.findMany({
      where,
      orderBy: { endedAt: 'desc' },
      skip: (page - 1) * ROUNDS_PER_PAGE,
      take: ROUNDS_PER_PAGE,
      include: {
        _count: { select: { results: true } },
        // De winnaar: plaats 1, bij een gedeelde eerste plaats de eerste op naam (zelfde volgorde als getRanking).
        results: { where: { rank: 1 }, orderBy: { nickname: 'asc' }, take: 1, select: { nickname: true } },
      },
    }),
    prisma.gameResult.count({ where: { session: visibleRounds(user), isBot: false } }),
    prisma.gameResult.count({ where: { session: visibleRounds(user), isBot: false, userId: { not: null } } }),
  ])

  return {
    total,
    page,
    pageSize: ROUNDS_PER_PAGE,
    stats: {
      rounds: await prisma.gameSession.count({ where: visibleRounds(user) }),
      players,
      accountPercent: players > 0 ? Math.round((withAccount / players) * 100) : null,
    },
    rounds: rounds.map((round) => ({
      id: round.id,
      quizTitle: round.quizTitle ?? 'Open ICT Quiz',
      code: round.code,
      round: round.round,
      endedAt: round.endedAt,
      playerCount: round._count.results,
      winner: round.results[0]?.nickname ?? null,
    })),
  }
}

/** De eindstand van één ronde. Geen e-mailadressen of andere accountgegevens: alleen naam, plaats en score. */
export async function getRound(id, user) {
  const round = await prisma.gameSession.findFirst({
    where: { id, ...visibleRounds(user) },
    include: {
      results: {
        orderBy: [{ rank: 'asc' }, { nickname: 'asc' }],
        select: { nickname: true, rank: true, score: true, correctCount: true, userId: true, isBot: true },
      },
    },
  })
  if (!round) throw new ApiError('ROUND_NOT_FOUND', 'Deze ronde bestaat niet.', 404)
  return {
    id: round.id,
    quizTitle: round.quizTitle ?? 'Open ICT Quiz',
    code: round.code,
    round: round.round,
    endedAt: round.endedAt,
    questionCount: round.questionCount,
    standings: round.results.map(({ userId, ...result }) => ({ ...result, isVerified: userId !== null })),
  }
}

/** De cijfertegels van het admin-overzicht. */
export async function getOverviewStats(user) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const rounds = visibleRounds(user)
  const [quizzes, users, roundsThisWeek, totals] = await prisma.$transaction([
    prisma.quiz.count({ where: user.role === 'ADMIN' ? {} : { ownerId: user.id } }),
    prisma.user.count(),
    prisma.gameSession.count({ where: { ...rounds, endedAt: { gte: weekAgo } } }),
    prisma.gameResult.findMany({
      where: { isBot: false, session: rounds },
      select: { correctCount: true, session: { select: { questionCount: true } } },
      orderBy: { id: 'desc' },
      take: 5000, // genoeg voor een goed gemiddelde, zonder de hele tabel te lezen
    }),
  ])
  const questions = totals.reduce((sum, row) => sum + row.session.questionCount, 0)
  const correct = totals.reduce((sum, row) => sum + row.correctCount, 0)
  return {
    quizzes,
    users,
    roundsThisWeek,
    correctPercent: questions > 0 ? Math.round((correct / questions) * 100) : null,
  }
}
