import { Router } from 'express'
import { prisma } from '../db/prisma.js'

export const quizzesRouter = Router()

// GET /api/quizzes?search=web → lijst met quizzen (titel/omschrijving, hoofdletterongevoelig)
quizzesRouter.get('/', async (req, res) => {
  const search = String(req.query.search ?? '').trim()
  const where = { isPublished: true }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const quizzes = await prisma.quiz.findMany({
    where,
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      role: { select: { key: true, name: true, color: true } },
      _count: { select: { questions: true } },
    },
  })

  res.json(quizzes.map(({ _count, ...quiz }) => ({ ...quiz, questionCount: _count.questions })))
})

// GET /api/quizzes/:id → één quiz met vragen, ZONDER isCorrect (anders kun je valsspelen)
quizzesRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'INVALID_ID', message: 'Ongeldig quiz-id.' })
  }

  const quiz = await prisma.quiz.findFirst({
    where: { id, isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      role: { select: { key: true, name: true, color: true } },
      questions: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          text: true,
          order: true,
          timeLimitSec: true,
          difficulty: true,
          // Let op: alleen id + text, dus GEEN isCorrect.
          options: { orderBy: { order: 'asc' }, select: { id: true, text: true } },
        },
      },
    },
  })

  if (!quiz)
    return res.status(404).json({ error: 'QUIZ_NOT_FOUND', message: 'Quiz niet gevonden.' })
  res.json(quiz)
})
