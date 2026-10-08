import app from './app.js'
import { prisma } from './db/prisma.js'

const port = 3000

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})