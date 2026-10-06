import { Router } from 'express'
import { prisma } from '../db/prisma.js'

export const healthRouter = Router()

// GET /api/health → { status: 'ok', db: 'ok' }
healthRouter.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'ok' })
  } catch (error) {
    console.error('Database niet bereikbaar:', error.message)
    res.status(503).json({ status: 'error', db: 'error' })
  }
})
