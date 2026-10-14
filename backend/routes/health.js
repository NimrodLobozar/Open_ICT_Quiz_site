import { Router } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

router.get('/', (_request, response) => {
  response.json({ status: 'ok' })
})

router.get('/database', async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Database health check failed:', error)
    response.status(503).json({ status: 'error', database: 'disconnected' })
  }
})

export default router