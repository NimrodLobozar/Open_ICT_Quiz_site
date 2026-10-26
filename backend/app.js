import 'dotenv/config'
import express from 'express'
import gamesRouter from './routes/games.js'
import healthRouter from './routes/health.js'
import leaderboardRouter from './routes/leaderboard.js'

const app = express()

app.use(express.json())
app.use('/api/health', healthRouter)
app.use('/api/games', gamesRouter)
app.use('/api/leaderboard', leaderboardRouter)

export default app
