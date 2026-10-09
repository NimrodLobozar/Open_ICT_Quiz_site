import { Router } from 'express'
import { GameError } from '../game/GameError.js'
import { gameManager } from '../game/GameManager.js'
import { sendLobbyUpdate } from '../socket/broadcast.js'
import { playerRoom } from '../socket/rooms.js'
import {
  clearSessionCookie,
  HOST_COOKIE,
  PLAYER_COOKIE,
  readCookies,
  setSessionCookie,
} from '../utils/cookies.js'

// REST voor alles wat een sessie start of stopt (projectplan 8.0).
// Waarom REST en geen socket? Alleen een HTTP-antwoord kan een httpOnly-cookie zetten of wissen.
const router = Router()

// De Socket.IO-server, zodat routes ook live-berichten kunnen sturen (zet index.js met app.set('io', io)).
const getIo = (request) => request.app.get('io')

function findGame(code) {
  const game = gameManager.getGame(code)
  if (!game) throw new GameError('GAME_NOT_FOUND', 'Deze code bestaat niet.', 404)
  return game
}

// De sessie uit de cookie, maar alleen als die bij deze game hoort.
function readSession(request, cookieName, code) {
  const token = readCookies(request.headers.cookie)[cookieName]
  const session = gameManager.getSession(token)
  return session?.code === code ? { token, ...session } : null
}

// Nieuwe game. De browser die dit doet, wordt de host.
router.post('/', (_request, response) => {
  const game = gameManager.createGame()
  const token = gameManager.createSession({ code: game.code, role: 'host' })
  setSessionCookie(response, HOST_COOKIE, token)
  response.status(201).json({ gameCode: game.code })
})

// Voor het joinformulier: bestaat deze code?
router.get('/:code', (request, response) => {
  const game = findGame(request.params.code)
  response.json({ exists: true, locked: game.locked, phase: game.phase })
})

// Joinen met een naam.
router.post('/:code/players', (request, response) => {
  const { code } = request.params
  const game = findGame(code)

  // Zit deze browser al in deze game? Dan geen tweede speler maken, gewoon terugsturen.
  const existing = readSession(request, PLAYER_COOKIE, code)
  const existingPlayer = existing && game.getPlayer(existing.playerId)
  if (existingPlayer) {
    return response.json({ playerId: existingPlayer.id, nickname: existingPlayer.nickname })
  }

  const player = game.addPlayer(request.body?.nickname)
  const token = gameManager.createSession({ code, role: 'player', playerId: player.id })
  setSessionCookie(response, PLAYER_COOKIE, token)
  sendLobbyUpdate(getIo(request), game)
  response.status(201).json({ playerId: player.id, nickname: player.nickname })
})

// "Wie ben ik in deze game?" Voor rejoinen na verversen of tabblad sluiten.
// ?role=host vraagt naar de host-cookie; anders de speler-cookie.
router.get('/:code/me', (request, response) => {
  const { code } = request.params
  const game = findGame(code)

  if (request.query.role === 'host') {
    if (!readSession(request, HOST_COOKIE, code)) throw new GameError('NO_SESSION', 'Geen sessie.', 401)
    return response.json({ role: 'host' })
  }

  const session = readSession(request, PLAYER_COOKIE, code)
  const player = session && game.getPlayer(session.playerId)
  if (!player) throw new GameError('NO_SESSION', 'Geen sessie.', 401)
  response.json({ role: 'player', playerId: player.id, nickname: player.nickname })
})

// Speler verlaat het spel ("Terug naar start"): speler weg, cookie weg, naam vrij.
router.delete('/:code/players/me', (request, response) => {
  const { code } = request.params
  const session = readSession(request, PLAYER_COOKIE, code)
  // De cookie wissen we altijd, ook als de sessie al verlopen was: dan begint de browser schoon.
  clearSessionCookie(response, PLAYER_COOKIE)
  if (!session) return response.json({ ok: true })

  gameManager.deleteSession(session.token)
  const game = gameManager.getGame(code)
  if (game) {
    game.removePlayer(session.playerId)
    const io = getIo(request)
    // Open sockets van deze speler (bijv. een tweede tabblad) verbreken: die horen nergens meer bij.
    io.in(playerRoom(code, session.playerId)).disconnectSockets(true)
    sendLobbyUpdate(io, game)
  }
  response.json({ ok: true })
})

// Express 5 vangt ook fouten uit deze routes op en stuurt ze hierheen.
router.use((error, _request, response, next) => {
  if (!(error instanceof GameError)) return next(error)
  response.status(error.status).json({ error: error.code, message: error.message })
})

export default router
