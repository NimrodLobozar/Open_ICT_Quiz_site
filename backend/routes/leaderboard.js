import { Router } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

router.get('/', (_request, response) => {
  const users = [
    {
        id: 1, name: 'Sanne', totalScore: 18420, totalWins: 3, gamesPlayed: 6, averageScore: 3070, totalCorrect: 29
    },
    {
        id: 2, name: 'Daan', totalScore: 16280, totalWins: 4, gamesPlayed: 9, averageScore: 1809, totalCorrect: 58
    },
    {
        id: 3, name: 'Fatima', totalScore: 15150, totalWins: 2, gamesPlayed: 4, averageScore: 3788, totalCorrect: 24
    },
    {
        id: 4, name: 'Lucas', totalScore: 11900, totalWins: 1, gamesPlayed: 7, averageScore: 1700, totalCorrect: 31
    },
    {
        id: 5, name: 'Noah', totalScore: 13980, totalWins: 3, gamesPlayed: 5, averageScore: 2796, totalCorrect: 22
    },
    {
        id: 6, name: 'Mo', totalScore: 9800, totalWins: 1, gamesPlayed: 3, averageScore: 3267, totalCorrect: 15
    },
    {
        id: 7, name: 'Emma', totalScore: 12750, totalWins: 2, gamesPlayed: 8, averageScore: 1594, totalCorrect: 36
    },
    {
        id: 8, name: 'quizkoning', totalScore: 7600, totalWins: 0, gamesPlayed: 2, averageScore: 3800, totalCorrect: 13
    },
    {
        id: 9, name: 'Yara', totalScore: 14500, totalWins: 2, gamesPlayed: 10, averageScore: 1450, totalCorrect: 44
    },
    {
        id: 10, name: 'Tim_04', totalScore: 6400, totalWins: 0, gamesPlayed: 5, averageScore: 1280, totalCorrect: 19
    },
    {
        id: 11, name: 'Joris', totalScore: 5200, totalWins: 1, gamesPlayed: 2, averageScore: 2600, totalCorrect: 9
    },
    {
        id: 12, name: 'Lotte', totalScore: 11200, totalWins: 3, gamesPlayed: 12, averageScore: 933, totalCorrect: 48
    },
    {
        id: 13, name: 'Sofie', totalScore: 8700, totalWins: 0, gamesPlayed: 14, averageScore: 621, totalCorrect: 52
    },
    {
        id: 14, name: 'Timo', totalScore: 10150, totalWins: 1, gamesPlayed: 6, averageScore: 1692, totalCorrect: 27
    },
    {
        id: 15, name: 'Lars', totalScore: 4300, totalWins: 0, gamesPlayed: 1, averageScore: 4300, totalCorrect: 7
    }
  ];

    response.json(users)
})

export default router