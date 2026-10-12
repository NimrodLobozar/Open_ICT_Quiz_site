import { prisma } from '../db/prisma.js'
import { EVENTS } from './events.js'

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on(EVENTS.LOBBY_JOIN, async ({ code, playerId, nickname, skills = {}, role = 'player' } = {}, ack) => {
      try {
        const quiz = await prisma.quiz.findUnique({ where: { code } })

        if (!quiz || !quiz.isActive) {
          return ack?.({ ok: false, error: 'QUIZ_NOT_FOUND' })
        }

        if (quiz.locked && role === 'player' && !playerId) {
          return ack?.({ ok: false, error: 'QUIZ_LOCKED' })
        }

        let player = null

        if (playerId) {
          player = await prisma.player.findFirst({
            where: { id: playerId, quizId: quiz.id },
          })
        }

        if (!player && role === 'player') {
          if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2) {
            return ack?.({ ok: false, error: 'NICKNAME_REQUIRED' })
          }

          player = await prisma.player.create({
            data: {
              nickname: nickname.trim(),
              skills,
              quizId: quiz.id,
            },
          })
        }

        socket.join(code)
        socket.data = { code, quizId: quiz.id, playerId: player?.id ?? null, role }

        ack?.({ ok: true, player })
        await emitLobbyUpdate(io, code)
      } catch (error) {
        console.error('Error joining lobby over Socket.IO:', error)
        ack?.({ ok: false, error: 'JOIN_FAILED' })
      }
    })

    socket.on('lobby:lock', async ({ locked = true } = {}, ack) => {
      if (socket.data.role !== 'host' || !socket.data.quizId) {
        return ack?.({ ok: false, error: 'NOT_HOST' })
      }

      try {
        await prisma.quiz.update({
          where: { id: socket.data.quizId },
          data: { locked },
        })

        io.to(socket.data.code).emit('lobby:locked', { locked })
        ack?.({ ok: true, locked })
      } catch (error) {
        console.error('Error locking lobby:', error)
        ack?.({ ok: false, error: 'LOCK_FAILED' })
      }
    })
  })
}

async function emitLobbyUpdate(io, code) {
  const players = await prisma.player.findMany({
    where: { quiz: { code } },
    select: { id: true, nickname: true, skills: true },
    orderBy: { createdAt: 'asc' },
  })

  io.to(code).emit(EVENTS.LOBBY_UPDATE, {
    players,
    playerCount: players.length,
  })
}
