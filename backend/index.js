import { createServer } from 'node:http'
import { Server } from 'socket.io'
import app from './app.js'
import { prisma } from './db/prisma.js'
import { registerSocketHandlers } from './socket/index.js'

const port = 3000
const httpServer = createServer(app)
const io = new Server(httpServer)

registerSocketHandlers(io)

httpServer.listen(port, () => {
  console.log(`API + Socket.IO running at http://localhost:${port}`)
})

process.on('SIGTERM', async () => {
  io.close()
  await prisma.$disconnect()
  process.exit(0)
})