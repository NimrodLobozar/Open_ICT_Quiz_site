// Startpunt van de server: Express (REST) + Socket.IO (realtime) op één poort.
import { createServer } from 'node:http'
import cookieParser from 'cookie-parser'
import express from 'express'
import { Server } from 'socket.io'
import { config } from './config.js'
import { GameError } from './constants/errors.js'
import { gamesRouter } from './routes/games.js'
import { healthRouter } from './routes/health.js'
import { quizzesRouter } from './routes/quizzes.js'
import { setupSocket } from './socket/index.js'

const app = express()
const httpServer = createServer(app)
// Geen CORS nodig: de browser praat alleen met Vite (poort 5173), die stuurt alles door.
const io = new Server(httpServer)
app.set('io', io) // zodat routes events kunnen sturen: req.app.get('io')

app.use(express.json())
app.use(cookieParser())

app.use('/api/health', healthRouter)
app.use('/api/quizzes', quizzesRouter)
app.use('/api/games', gamesRouter)

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Deze API-route bestaat niet.' })
})

// Foutafhandeling: GameError → nette foutmelding, al het andere → 500.
// Express 5 vangt ook fouten uit async routes automatisch op.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error instanceof GameError) {
    return res.status(error.status).json({ error: error.code, message: error.message })
  }
  console.error(error)
  res.status(500).json({ error: 'INTERNAL', message: 'Er ging iets mis op de server.' })
})

setupSocket(io)

httpServer.listen(config.port, () => {
  console.log(`Server draait op http://localhost:${config.port} (${config.nodeEnv})`)
})
