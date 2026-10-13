import 'dotenv/config'
import express from 'express'
import gamesRouter from './routes/games.js'
import healthRouter from './routes/health.js'
import codeRouter from './routes/code.js'

const app = express()

app.use(express.json())
app.use('/api/health', healthRouter)
app.use('/api/code', codeRouter);
app.use('/api/games', gamesRouter)

export default app
