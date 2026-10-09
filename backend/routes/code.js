import { Router } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

router.get('/:code', async (request, response) => {
  const { code } = request.params

  if (!code) {
    return response.status(400).json({ error: 'Code is required' })
  }

  if (code === '000000' || code === '123456' || code === '654321') {
    return response.json({ exists: true })
  } else {
    return response.json({ exists: false })
  }

//   try {
//     const lobby = await prisma.lobby.findUnique({
//       where: { code },
//     })

//     response.json({ exists: !!lobby })
//   } catch (error) {
//     console.error('Error checking lobby code:', error)
//     response.status(500).json({ error: 'Internal server error' })
//   }
})

export default router