import { createServer } from 'node:http'
import { Server } from 'socket.io'
import app from './app.js'
import { prisma } from './db/prisma.js'
import { registerSocketHandlers } from './socket/index.js'

const port = 3000

// Express alleen kan geen WebSockets. Daarom maken we zelf een HTTP-server
// en hangen we Express (REST) én Socket.IO (live) aan dezelfde server en poort.
const httpServer = createServer(app)

// Geen CORS-instellingen nodig: de browser praat via de Vite-proxy, dus alles is dezelfde origin.
const io = new Server(httpServer)
registerSocketHandlers(io)

// Zo kunnen REST-routes ook live-berichten sturen (bijv. lobby:update na het joinen).
app.set('io', io)

// Let op: httpServer.listen, níet app.listen. Anders draait Socket.IO niet mee.
httpServer.listen(port, () => {
  console.log(`API + Socket.IO running at http://localhost:${port}`)
})

process.on('SIGTERM', async () => {
  io.close()
  await prisma.$disconnect()
  process.exit(0)
})
