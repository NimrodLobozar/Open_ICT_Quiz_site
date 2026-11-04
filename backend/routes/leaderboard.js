import { Router } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

router.get('/', async (_request, response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      skills: true,
      results: {
        where: { isBot: false },
        select: { score: true, rank: true, correctCount: true },
      },
    },
  })

  const leaderboard = users
    .map(({ id, username, skills, results }) => {
      const totalScore = results.reduce((sum, result) => sum + result.score, 0)
      const gamesPlayed = results.length

      return {
        id,
        name: username,
        skills: skills,
        totalScore,
        totalWins: results.filter((result) => result.rank === 1).length,
        gamesPlayed,
        averageScore: gamesPlayed ? Math.round(totalScore / gamesPlayed) : 0,
        totalCorrect: results.reduce((sum, result) => sum + result.correctCount, 0),
      }
    })
    .sort((first, second) => second.totalScore - first.totalScore)

  response.json(leaderboard)
})

export default router
