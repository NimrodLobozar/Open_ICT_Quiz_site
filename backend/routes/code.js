import { Router } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

router.get('/:code', async (request, response) => {
  const { code } = request.params

  if (!code) {
    return response.status(400).json({ error: 'Code is required' })
  }

  try {
    const lobby = await prisma.quiz.findUnique({
      where: { code },
      select: { title: true, locked: true, isActive: true },
    })

    response.json({
      exists: !!lobby,
      quiz: lobby,
    })
  } catch (error) {
    console.error('Error checking lobby code:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:code/join', async (request, response) => {
  const { code } = request.params
  const { nickname, skills = {} } = request.body

  if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2) {
    return response.status(400).json({ error: 'Nickname is required' })
  }

  try {
    const quiz = await prisma.quiz.findUnique({ where: { code } })

    if (!quiz) {
      return response.status(404).json({ error: 'Quiz not found' })
    }

    if (quiz.locked || !quiz.isActive) {
      return response.status(409).json({ error: 'Quiz is not available' })
    }

    const player = await prisma.player.create({
      data: {
        nickname: nickname.trim(),
        skills,
        quizId: quiz.id,
      },
    })

    return response.status(201).json({ player })
  } catch (error) {
    console.error('Error joining quiz:', error)
    return response.status(500).json({ error: 'Internal server error' })
  }
})

export default router