# Socket.IO: implementatiegids

Hoe we de backend (Express + Prisma) live laten praten met de host en de spelers, en hoe de eindstand uit de database op het eindscherm komt.

> Socket.IO is **nog niet geïnstalleerd**. Deze gids gaat uit van de code zoals die nu is: [`backend/app.js`](../backend/app.js), [`backend/index.js`](../backend/index.js), [`backend/db/prisma.js`](../backend/db/prisma.js) en [`vite.config.js`](../vite.config.js). De eventnamen komen uit hoofdstuk 8 van het projectplan.

## 1. Het idee

```
 Host (digibord)        Speler (telefoon)
        │                      │
        └──── browser ─────────┘
                  │  http://<ip>:5173
        ┌─────────▼─────────┐
        │ Vite (frontend)   │  /api       ──┐  gewone HTTP-requests
        │                   │  /socket.io ──┤  live verbinding (WebSocket)
        └───────────────────┘               │
                                  ┌─────────▼─────────┐
                                  │ backend :3000     │  Express + Socket.IO
                                  └─────────┬─────────┘
                                            │ Prisma
                                  ┌─────────▼─────────┐
                                  │ PostgreSQL        │  Quiz, Player
                                  └───────────────────┘
```

- **REST (`/api/...`)** voor dingen die één keer gebeuren en een antwoord nodig hebben: lobby aanmaken, joinen, de uitslag opvragen na een refresh.
- **Socket.IO** voor alles wat iedereen tegelijk moet zien: lobby-updates, vragen, scores, het podium.
- **De browser praat nooit direct met de database.** Alleen de backend gebruikt Prisma. De frontend krijgt data via REST of via een socket-event.
- **De server is de baas:** hij rekent de punten uit en bepaalt de ranking. De client stuurt alleen "ik kies optie X".

## 2. Installeren

```bash
npm install socket.io socket.io-client
```

`socket.io` is voor de backend, `socket.io-client` voor React. Ze staan in dezelfde `package.json`, want frontend en backend delen er nu één.

Draai je met Docker? Bouw dan opnieuw, want de backend-container heeft geen volume en ziet nieuwe packages of code anders niet:

```bash
docker compose up --build
```

## 3. Backend: Socket.IO aan Express koppelen

Express alleen kan geen WebSockets. Daarom maken we zelf een HTTP-server, en hangen we zowel Express als Socket.IO daaraan.

**`backend/index.js`**

```js
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import app from './app.js'
import { prisma } from './db/prisma.js'
import { registerSocketHandlers } from './socket/index.js'

const port = 3000

// Eén HTTP-server voor zowel de REST-API (app) als Socket.IO.
const httpServer = createServer(app)

// Geen CORS-instellingen nodig: de browser praat via de Vite-proxy, dus alles is dezelfde origin.
const io = new Server(httpServer)
registerSocketHandlers(io)

// Let op: httpServer.listen, níet app.listen. Anders draait Socket.IO niet mee.
httpServer.listen(port, () => {
  console.log(`API + Socket.IO running at http://localhost:${port}`)
})

process.on('SIGTERM', async () => {
  io.close()
  await prisma.$disconnect()
  process.exit(0)
})
```

**`backend/socket/events.js`**: alle eventnamen op één plek, zodat een typfout een fout geeft in plaats van een event dat stil niet aankomt.

```js
export const EVENTS = {
  // Client → server
  LOBBY_JOIN: 'lobby:join',
  HOST_NEXT: 'host:next',
  HOST_END: 'host:end',
  PLAYER_ANSWER: 'player:answer',
  GAME_SYNC: 'game:sync',

  // Server → client
  LOBBY_UPDATE: 'lobby:update',
  GAME_PODIUM: 'game:podium',
  ERROR: 'error',
}
```

> In het projectplan koppelt een cookie de socket automatisch aan de juiste game (`sessionMiddleware`). Dat bestaat nog niet, daarom gebruikt deze gids eerst een simpel `lobby:join`-event met de code en het `playerId`. Als de cookies er zijn, verdwijnt `lobby:join` en zet de middleware `socket.data` in plaats daarvan.

**`backend/socket/index.js`**

```js
import { prisma } from '../db/prisma.js'
import { getRanking } from '../../src/utils/ranking.js'
import { EVENTS } from './events.js'

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Speler of host meldt zich aan bij een lobby.
    // ack = callback van de client, zodat die weet of het gelukt is.
    socket.on(EVENTS.LOBBY_JOIN, async ({ code, playerId, role }, ack) => {
      const quiz = await prisma.quiz.findUnique({ where: { code } })
      if (!quiz) return ack?.({ ok: false, error: 'GAME_NOT_FOUND' })

      // Room = lobbycode. Alles wat we naar deze room sturen, komt bij iedereen in deze lobby aan.
      socket.join(code)
      if (role === 'host') socket.join(`${code}:host`)
      socket.data = { code, quizId: quiz.id, playerId, role }

      ack?.({ ok: true })
      await sendLobbyUpdate(io, code)
    })

    // De host sluit de quiz af: scores vastzetten en het podium naar iedereen sturen.
    socket.on(EVENTS.HOST_END, async (_payload, ack) => {
      if (socket.data.role !== 'host') return ack?.({ ok: false, error: 'NOT_HOST' })

      const results = await getResults(socket.data.code)
      io.to(socket.data.code).emit(EVENTS.GAME_PODIUM, results)
      ack?.({ ok: true })
    })

    // Na een refresh of verbindingsverlies vraagt de client de huidige stand op.
    socket.on(EVENTS.GAME_SYNC, async (_payload, ack) => {
      if (!socket.data.code) return ack?.({ ok: false, error: 'NO_SESSION' })
      ack?.({ ok: true, state: await getResults(socket.data.code) })
    })
  })
}

async function sendLobbyUpdate(io, code) {
  const players = await prisma.player.findMany({
    where: { quiz: { code } },
    select: { id: true, nickname: true },
    orderBy: { createdAt: 'asc' },
  })
  io.to(code).emit(EVENTS.LOBBY_UPDATE, { players, playerCount: players.length })
}

// Zelfde vorm als gameResults in dummyDatabase.js, zodat het eindscherm niet hoeft te veranderen.
async function getResults(code) {
  const players = await prisma.player.findMany({
    where: { quiz: { code } },
    select: { id: true, nickname: true, score: true, correctCount: true },
  })
  return { ranking: getRanking(players) }
}
```

`score` en `correctCount` bestaan nog niet op `Player`; zie [DATABASE.md](DATABASE.md#voorstel-score-op-player-zetten-kleinste-stap) voor de schemawijziging.

Voor de Docker-build: voeg `COPY src/utils ./src/utils` toe aan [`Dockerfile.backend`](../Dockerfile.backend), anders vindt de backend `ranking.js` niet.

## 4. Vite-proxy: `/socket.io` doorsturen

Zonder dit probeert de browser de socket op poort 5173 te openen en krijgt hij een 404.

**`vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker is dit http://backend:3000, lokaal http://localhost:3000.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': apiTarget,
      // ws: true is nodig om ook de WebSocket-verbinding door te sturen, niet alleen gewone requests.
      '/socket.io': { target: apiTarget, ws: true },
    },
  },
})
```

## 5. Frontend: één socket voor de hele app

**`src/socket.js`**

```js
import { io } from 'socket.io-client'

// Geen URL: verbind met dezelfde host als de pagina, de Vite-proxy doet de rest.
// Daardoor werkt het ook op telefoons via het LAN-IP.
// autoConnect: false, zodat we pas verbinden als we weten bij welke lobby iemand hoort.
export const socket = io({ autoConnect: false })
```

**`src/hooks/useSocketEvent.js`**: luisteren naar een event en netjes stoppen als het component verdwijnt.

```js
import { useEffect } from 'react'
import { socket } from '../socket.js'

export function useSocketEvent(event, handler) {
  useEffect(() => {
    socket.on(event, handler)
    // Zonder off() stapelen de listeners op bij elke render en krijg je alles dubbel.
    return () => socket.off(event, handler)
  }, [event, handler])
}
```

## 6. Het eindscherm aan de server koppelen

[`EndScreenPage.jsx`](../src/pages/EndScreenPage/EndScreenPage.jsx) gebruikt nu `dummyDatabase.js`. Zo vervang je dat:

```jsx
import { useCallback, useEffect, useState } from 'react'
import Podium from '../../components/Podium.jsx'
import { useSocketEvent } from '../../hooks/useSocketEvent.js'
import { socket } from '../../socket.js'
import './EndScreenPage.css'

export default function EndScreenPage() {
  const [ranking, setRanking] = useState([])

  // Komt binnen als de host op "Einde" drukt.
  const handlePodium = useCallback((data) => setRanking(data.ranking), [])
  useSocketEvent('game:podium', handlePodium)

  // Bij een refresh missen we game:podium, dus vragen we de stand zelf op.
  useEffect(() => {
    socket.emit('game:sync', {}, (response) => {
      if (response.ok) setRanking(response.state.ranking)
    })
  }, [])

  return (
    <main className="end-screen">
      <Podium ranking={ranking} />
      {/* Scoreboard krijgt dezelfde ranking, zodat podium en lijst altijd gelijk zijn. */}
    </main>
  )
}
```

De server stuurt de ranking al door `getRanking()` heen, dus de frontend hoeft niet opnieuw te sorteren. Wil je de server zo dom mogelijk houden, dan kan de server ook ruwe resultaten sturen en roep je `getRanking()` in de frontend aan. Kies één plek, niet allebei.

**Scoreboard op de telefoon van een speler:** je eigen rij markeren gaat met het `playerId` dat de speler bij het joinen kreeg:

```jsx
<li className={row.id === myPlayerId ? 'scoreboard__row scoreboard__row--me' : 'scoreboard__row'}>
```

## 7. De volledige flow, van join tot eindscherm

| Stap | Wie | Hoe | Database |
|---|---|---|---|
| 1. Lobby maken | host | `POST /api/games` → `{ code }` | `prisma.quiz.create(...)` |
| 2. Joinen | speler | `POST /api/games/:code/players` met `{ nickname }` → `{ playerId }` | `prisma.player.create(...)` |
| 3. Verbinden | beide | `socket.connect()` en daarna `lobby:join` | `findUnique` op `code` |
| 4. Lobby live | server → room | `lobby:update` | `findMany` spelers |
| 5. Antwoord | speler | `player:answer` | score `increment` (of in geheugen) |
| 6. Einde | host | `host:end` | scores ophalen |
| 7. Podium | server → room | `game:podium` met `{ ranking }` | — |
| 8. Refresh | beide | `game:sync` (of `GET /api/games/:code/results`) | scores ophalen |

Stap 1 en 2 zijn REST omdat de server daar later een cookie moet zetten (projectplan 6.1). Dat kan alleen in een HTTP-antwoord, niet via een socket.

## 8. Testen

1. `docker compose up --build`
2. Maak testdata aan met de Prisma-voorbeelden uit [DATABASE.md](DATABASE.md#prisma-in-de-backend), of in `psql`:
   ```sql
   INSERT INTO "Quiz" (code, title) VALUES ('482913', 'Test');
   INSERT INTO "Player" (nickname, "quizId", score, "correctCount")
   SELECT n, q.id, s, c FROM "Quiz" q,
     (VALUES ('Sanne', 7420, 8), ('Mo', 6150, 7), ('Fatima', 6150, 7)) AS v(n, s, c)
   WHERE q.code = '482913';
   ```
3. Open de host en een speler in **verschillende browsers** (of één in een incognitovenster). Gewone tabs delen cookies en lijken dan dezelfde persoon.
4. In de DevTools van de browser, tabblad **Network → WS**, zie je de socketberichten heen en weer gaan.
5. Backend-logs: `docker compose logs -f backend`.

## 9. Valkuilen

- **`app.listen` in plaats van `httpServer.listen`**: de API werkt, maar Socket.IO geeft 404.
- **`ws: true` vergeten in de proxy**: Socket.IO valt terug op long-polling. Het werkt, maar trager, en het lijkt alsof alles goed is.
- **Listeners niet opruimen**: elk event komt twee of drie keer binnen. Gebruik `useSocketEvent` of `socket.off` in de cleanup.
- **Het goede antwoord meesturen met de vraag**: dan kan iedereen het zien in DevTools. Stuur `isCorrect` pas mee in `question:end`.
- **Ranking op twee plekken berekenen**: dan kunnen podium en scoreboard het oneens zijn bij gelijke scores. Altijd via `getRanking()`.
- **Backend-code veranderd, maar niets gebeurt**: de backend-container heeft geen volume. `docker compose up --build backend`.
