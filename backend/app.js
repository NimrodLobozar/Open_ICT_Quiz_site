import 'dotenv/config'
import express from 'express'
import healthRouter from './routes/health.js'
import codeRouter from './routes/code.js'

const app = express()

app.use(express.json())
app.use('/api/health', healthRouter)
app.use('/api/code', codeRouter);

export default app