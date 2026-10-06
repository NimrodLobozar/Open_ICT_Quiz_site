// REST-routes voor sessies: game aanmaken, joinen, "wie ben ik?", verlaten.
// Alleen een HTTP-antwoord kan een cookie zetten, daarom gaat dit via REST en niet via Socket.IO.
// Zie docs/PROJECTPLAN.md hoofdstuk 6.1 en 8.0.
import { Router } from 'express'
import { GameError, GAME_NOT_FOUND, NO_SESSION } from '../constants/errors.js'
import { prisma } from '../db/prisma.js'
import { isValidCode } from '../game/codeGenerator.js'
import { gameManager } from '../game/GameManager.js'
import { disconnectPlayer, emitLobbyUpdate } from '../socket/broadcast.js'
import {
  clearSessionCookie,
  HOST_COOKIE,
  PLAYER_COOKIE,
  readSession,
  setSessionCookie,
} from '../utils/cookies.js'

export const gamesRouter = Router()

// Controleer :code één keer voor alle routes: precies 6 cijfers.
gamesRouter.param('code', (req, res, next, code) => {
  if (!isValidCode(code)) return next(new GameError(GAME_NOT_FOUND, 'Deze code bestaat niet.', 404))
  next()
})

// POST /api/games  { quizId, settings } → { gameCode } + cookie quiz_host
gamesRouter.post('/', async (req, res) => {
  const quizId = Number(req.body?.quizId)
  const quiz = Number.isInteger(quizId)
    ? await prisma.quiz.findFirst({
        where: { id: quizId, isPublished: true },
        include: {
          // De server heeft isCorrect nodig om punten te geven. Dit blijft op de server.
          questions: {
            orderBy: { order: 'asc' },
            include: { options: { orderBy: { order: 'asc' } } },
          },
        },
      })
    : null
  if (!quiz) {
    return res.status(404).json({ error: 'QUIZ_NOT_FOUND', message: 'Quiz niet gevonden.' })
  }

  // TODO(team, L1/Open punt 4): mag iedereen hosten, of alleen ingelogde docenten?
  const { game, hostToken } = gameManager.createGame(quiz, req.body?.settings)
  setSessionCookie(res, HOST_COOKIE, hostToken)
  res.status(201).json({ gameCode: game.code })
})

// GET /api/games/:code → { exists, locked, phase, quizTitle } (voor het joinformulier)
gamesRouter.get('/:code', (req, res) => {
  const game = gameManager.getGame(req.params.code)
  res.json(game.getPublicInfo())
})

// POST /api/games/:code/players  { nickname } → { playerId, nickname } + cookie quiz_player
gamesRouter.post('/:code/players', (req, res) => {
  const game = gameManager.getGame(req.params.code)

  // Heeft deze browser al een geldige sessie voor DEZE game? Dan is het een rejoin, geen nieuwe speler.
  const existing = readSession(req, PLAYER_COOKIE)
  if (existing && existing.gameCode === game.code) {
    const player = game.getPlayer(existing.playerId)
    return res.json({ playerId: player.id, nickname: player.nickname })
  }

  // TODO(team, L1): is er een geldige quiz_auth-cookie? Gebruik dan de accountnaam en isVerified: true.
  const { player, token } = gameManager.joinGame(game.code, req.body?.nickname)
  // Eén speler-cookie per browser: een oude quiz_player wordt hiermee overschreven.
  setSessionCookie(res, PLAYER_COOKIE, token)
  emitLobbyUpdate(req.app.get('io'), game)
  res.status(201).json({ playerId: player.id, nickname: player.nickname })
})

// GET /api/games/:code/me?role=host|player → wie ben ik in deze game? (voor rejoin)
gamesRouter.get('/:code/me', (req, res) => {
  const game = gameManager.getGame(req.params.code)
  const wanted = req.query.role // optioneel: alleen naar één rol kijken

  if (wanted !== 'player') {
    const host = readSession(req, HOST_COOKIE)
    if (host && host.gameCode === game.code) return res.json({ role: 'host' })
  }
  if (wanted !== 'host') {
    const session = readSession(req, PLAYER_COOKIE)
    if (session && session.gameCode === game.code) {
      const player = game.getPlayer(session.playerId)
      return res.json({ role: 'player', playerId: player.id, nickname: player.nickname })
    }
  }
  res.status(401).json({ error: NO_SESSION, message: 'Je zit (nog) niet in deze game.' })
})

// DELETE /api/games/:code/players/me → speler verlaat de game, naam komt vrij, cookie weg
gamesRouter.delete('/:code/players/me', (req, res) => {
  const session = readSession(req, PLAYER_COOKIE)
  clearSessionCookie(res, PLAYER_COOKIE)
  if (!session || session.gameCode !== req.params.code) return res.json({ ok: true })

  gameManager.leaveGame(session.token)
  const io = req.app.get('io')
  disconnectPlayer(io, session.gameCode, session.playerId)
  const game = gameManager.findGame(session.gameCode)
  if (game) emitLobbyUpdate(io, game)
  res.json({ ok: true })
})
