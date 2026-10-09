# Socket.IO: hoe het werkt in onze quiz (+ oefening)

Deze uitleg gaat over de code zoals die nu in de repo staat. Het contract (alle events en payloads) staat in [SOCKET-EVENTS.md](SOCKET-EVENTS.md).

## 1. Waarom Socket.IO?

Met gewone HTTP vraagt de **browser** iets, en de server antwoordt. De server kan nooit uit zichzelf iets sturen. In een quiz moet dat wel: als de host op "volgende" drukt, moeten 30 telefoons **tegelijk** een nieuw scherm krijgen.

Socket.IO houdt daarom een **open verbinding** (meestal een WebSocket) tussen browser en server. Over die lijn kunnen beide kanten op elk moment berichten sturen. Een bericht heet een **event**: een naam (`'game:podium'`) plus data (een object).

| | REST (`fetch('/api/...')`) | Socket.IO |
|---|---|---|
| Wie begint? | altijd de client | allebei |
| Antwoord | één antwoord per request | ack (optioneel) of losse events |
| Cookie zetten | ja | **nee** |
| Gebruiken voor | joinen, verlaten, aanmaken | alles wat live is |

Daarom gebruiken we allebei: REST voor alles wat een cookie zet of wist, Socket.IO voor de rest.

## 2. De vier bouwstenen

### `emit` en `on`: berichten sturen en ontvangen

```js
// Kant A
socket.emit('hallo', { naam: 'Emma' })

// Kant B
socket.on('hallo', (data) => console.log(data.naam))
```

Dat werkt in beide richtingen, met precies dezelfde functies.

### Ack: een antwoord op één vraag

Geef als laatste argument een functie mee. De andere kant roept die aan als antwoord:

```js
// Client
const response = await socket.timeout(5000).emitWithAck('game:sync', {})

// Server
socket.on('game:sync', (payload, ack) => {
  ack({ ok: true, state: ... })
})
```

Wij gebruiken altijd de vorm `{ ok: true, ... }` of `{ ok: false, error, message }`. Onze helper `emitWithAck` in [`src/socket/socket.js`](../src/socket/socket.js) zet er een timeout van 5 seconden op, zodat je niet eeuwig wacht.

### Rooms: naar een groep sturen

Een room is een groep sockets. De server bepaalt wie erin zit:

```js
socket.join('482913')                       // deze socket in de room
io.to('482913').emit('game:podium', data)   // naar iedereen in de room
```

Onze rooms ([`backend/socket/rooms.js`](../backend/socket/rooms.js)):

| Room | Wie | Waarvoor |
|---|---|---|
| `482913` | host + alle spelers | broadcasts (lobby, podium) |
| `482913:host` | alleen de host | later: "x van y heeft geantwoord" |
| `482913:player:8` | één speler, al zijn tabbladen | persoonlijke berichten (`player:result`) |

Waarom een room per speler en niet `socket.id`? Na verversen krijgt een speler een **nieuwe** socket met een nieuw id. De room blijft hetzelfde.

### Middleware: wie ben jij?

`io.use(fn)` draait bij elke nieuwe verbinding, **vóór** `connection`. Daar controleren we de cookie ([`backend/socket/sessionMiddleware.js`](../backend/socket/sessionMiddleware.js)):

```js
export function sessionMiddleware(socket, next) {
  const { code, role } = socket.handshake.auth   // wat de client wil
  const cookies = readCookies(socket.request.headers.cookie) // wie hij écht is
  ...
  socket.data = { code, role, playerId }         // voor alle handlers hierna
  next()                                         // of next(new Error('NO_SESSION'))
}
```

De client kan in DevTools alles in `socket.auth` zetten. Daarom vertrouwen we alleen de **httpOnly-cookie**: die kan JavaScript niet lezen of nadoen.

## 3. De reis van één event: het podium

Zo komt "Emma, jij bent 8e van 12 spelers" op het scherm:

```
Host-browser                     Server                                   Speler-browser (Emma)
────────────                     ──────                                   ─────────────────────
emitWithAck('dev:finish') ──▶ hostHandlers.js
                               game.finish()      (stand vastzetten)
                               sendPodium(io, game)  (broadcast.js)
                                 ├─ io.to('482913').emit('game:podium') ──▶ PlayerGamePage: phase = PODIUM
                                 │                                    └──▶ HostGamePage: podium tonen
                                 └─ io.to('482913:player:8')
                                      .emit('player:result') ───────────▶ PlayerGamePage: result = {...}
                               ack({ ok: true }) ◀── antwoord naar de host
```

1. **Host** stuurt `dev:finish` (straks: `host:next` na de laatste vraag).
2. [`hostHandlers.js`](../backend/socket/hostHandlers.js) vangt het op. Alleen host-sockets hebben die handler, dus een speler kan dit niet.
3. `game.finish()` in [`Game.js`](../backend/game/Game.js) zet de eindstand vast met `getRanking()`. Daardoor is de eindstand gelijk aan de laatste tussenstand.
4. `sendPodium` in [`broadcast.js`](../backend/socket/broadcast.js) stuurt:
   - **één** `game:podium` naar de hele room. Host en spelers krijgen dus exact dezelfde lijst.
   - per speler een `player:result` naar zijn eigen room.
5. In [`PlayerGamePage.jsx`](../src/pages/PlayerGamePage/PlayerGamePage.jsx) luisteren `useSocketEvent(EVENTS.GAME_PODIUM, …)` en `useSocketEvent(EVENTS.PLAYER_RESULT, …)` en zetten ze de data in state. React tekent het eindscherm.

## 4. Verversen en verbinding kwijt: `game:sync`

Events zijn **eenmalig**. Ververs je de pagina, dan was je er niet bij toen `game:podium` werd gestuurd. Daarom:

1. Bij laden: `GET /api/games/:code/me` (REST) — heb ik een geldige cookie?
2. Ja → `connectSocket(code, 'player')`.
3. Op `'connect'` (gebeurt na de eerste verbinding **én** na elke automatische reconnect): `emitWithAck('game:sync')`.
4. De server bouwt de hele toestand ([`syncState.js`](../backend/socket/syncState.js)) en stuurt die in de ack terug, inclusief podium en eigen resultaat.

Regel om te onthouden: **live-events houden de toestand bij, `game:sync` herstelt hem.**

Valt wifi even weg, dan probeert Socket.IO zelf opnieuw te verbinden. Tijdens het wachten toont de pagina "Verbinding kwijt, opnieuw verbinden…".

## 5. React en sockets: `useSocketEvent`

```js
useSocketEvent(EVENTS.LOBBY_UPDATE, (lobby) => {
  setGame((current) => current && { ...current, lobby })
})
```

[`useSocketEvent`](../src/hooks/useSocketEvent.js) doet twee dingen:
- `socket.on` bij het mounten en `socket.off` bij het unmounten. Vergeet je `off`, dan krijg je elk event dubbel na navigeren.
- de nieuwste handler bewaren in een `ref`, zodat de listener niet bij elke render opnieuw aangemeld wordt.

Gebruik in `setGame` altijd de functievorm (`current => …`): een event kan binnenkomen terwijl React nog een oude `game` in de closure heeft.

## 6. Bestanden op een rij

| Bestand | Wat |
|---|---|
| [`backend/index.js`](../backend/index.js) | HTTP-server met Express én Socket.IO; `app.set('io', io)` |
| [`backend/socket/index.js`](../backend/socket/index.js) | middleware aanzetten, rooms joinen, `game:sync`, `disconnect` |
| [`backend/socket/sessionMiddleware.js`](../backend/socket/sessionMiddleware.js) | cookie → `socket.data` |
| [`backend/socket/hostHandlers.js`](../backend/socket/hostHandlers.js) | events die alleen de host mag sturen |
| [`backend/socket/broadcast.js`](../backend/socket/broadcast.js) | `sendLobbyUpdate`, `sendPodium` |
| [`backend/socket/syncState.js`](../backend/socket/syncState.js) | de toestand voor `game:sync` |
| [`backend/socket/rooms.js`](../backend/socket/rooms.js) | room-namen |
| [`backend/socket/events.js`](../backend/socket/events.js) | eventnamen (+ kopie in `src/socket/`) |
| [`backend/routes/games.js`](../backend/routes/games.js) | REST: aanmaken, joinen, `/me`, verlaten |
| [`backend/game/Game.js`](../backend/game/Game.js) | de regels; weet niets van sockets |
| [`src/socket/socket.js`](../src/socket/socket.js) | de ene gedeelde client-socket |
| [`vite.config.js`](../vite.config.js) | proxy `/socket.io` met `ws: true` |

## 7. Oefening: herstart door de host

**User story:** als de host de quiz herstart, gaat mijn scherm automatisch terug naar de lobby, met dezelfde naam en een score van 0.

Wat al klaarstaat:
- `game.restart()` in `Game.js` (spelers blijven, scores 0, fase `LOBBY`) en de test ervoor in `backend/tests/Game.test.js`.
- De eventnamen `EVENTS.HOST_RESTART` (`'host:restart'`) en `EVENTS.GAME_RESTARTED` (`'game:restarted'`) in beide `events.js`-bestanden.
- De knop "Nog een ronde" op het podium van de host roept `restart()` aan in `HostGamePage.jsx`.

Jij bouwt de socket-kant. Zoek naar `TODO(jij)` in de code.

### Stap 1 — Server: het event ontvangen

In [`backend/socket/hostHandlers.js`](../backend/socket/hostHandlers.js), op de plek van de TODO:

```js
socket.on(EVENTS.HOST_RESTART, (_payload, ack) => {
  try {
    // 1. Mag het? Alleen na het podium.
    // 2. game.restart()
    // 3. Iedereen in de room laten weten: EVENTS.GAME_RESTARTED
    // 4. De spelerslijst opnieuw sturen (sendLobbyUpdate)
    // 5. ack({ ok: true })
  } catch (error) {
    ack?.(toErrorResponse(error))
  }
})
```

Hints:
- Fout bij de verkeerde fase: `throw new GameError('WRONG_PHASE', 'Herstarten kan pas na het podium.')`. Importeer `PHASES` en `GameError` (staan al bovenaan).
- Naar de hele game sturen: `io.to(gameRoom(game.code)).emit(...)`. Importeer `gameRoom` uit `./rooms.js`.
- Waarom hoeven we niet te checken of het de host is? Kijk in `socket/index.js` wanneer `registerHostHandlers` wordt aangeroepen.

### Stap 2 — Host: het event versturen

In [`src/pages/HostGamePage/HostGamePage.jsx`](../src/pages/HostGamePage/HostGamePage.jsx) vervang je de inhoud van `restart()`:

```js
async function restart() {
  setError(null)
  const response = await emitWithAck(EVENTS.HOST_RESTART).catch(() => null)
  if (!response?.ok) {
    setError(response?.message ?? 'Geen antwoord van de server.')
  }
}
```

### Stap 3 — Iedereen: luisteren

De host zit ook in de room, dus krijgt ook `game:restarted`. Voeg in **zowel** `HostGamePage.jsx` als `PlayerGamePage.jsx` een listener toe:

```js
useSocketEvent(EVENTS.GAME_RESTARTED, () => {
  setGame((current) => current && { ...current, phase: 'LOBBY', podium: null, result: null })
})
```

Je hoeft de spelerslijst hier niet bij te werken: die komt met de `lobby:update` die de server direct daarna stuurt.

### Stap 4 — Testen

1. `docker compose up` (de backend herstart vanzelf als je een bestand opslaat).
2. Host in een gewoon venster: `http://localhost:5173/host/new`.
3. Speler in een **incognitovenster** of op je telefoon: `/join`, code invullen, naam.
4. Host: "Quiz afronden" → beide zien het eindscherm.
5. Host: "Nog een ronde" → de speler moet automatisch "Je zit erin!" zien met dezelfde naam.
6. Nog een keer "Quiz afronden": klopt de score? Hij begint weer bij 0, dus het totaal is alleen deze ronde.
7. Ververs de speler na de herstart: blijft hij in de lobby? (Dat regelt `game:sync` al voor je.)
8. DevTools → Network → WS → klik de socket → **Messages**: zie je `42["game:restarted",{}]` binnenkomen?

### Stap 5 — Contract bijwerken

Haal in [SOCKET-EVENTS.md](SOCKET-EVENTS.md) en beide `events.js`-bestanden de opmerking "oefening" / `TODO(jij)` weg.

### Wil je meer?

Op dezelfde manier, van makkelijk naar moeilijker:
- **`host:lock`** `{ locked }`: lobby op slot. `game.locked` bestaat al en `addPlayer` checkt het al. Stuur daarna `sendLobbyUpdate`.
- **`game:closed`**: host sluit de game; spelers gaan terug naar `/join`.
- **`player:answer`** + **`question:show`**: de echte game loop (fase 4). Gebruik `game.recordAnswer()`; stuur nooit het goede antwoord mee met de vraag.

## 8. Valkuilen

- **`app.listen` in plaats van `httpServer.listen`**: de API werkt, maar Socket.IO geeft 404.
- **`ws: true` vergeten in de Vite-proxy**: Socket.IO valt stil terug op long-polling. Het werkt, maar trager.
- **Listener zonder `off()`**: events komen dubbel binnen. Gebruik `useSocketEvent`.
- **Iets vertrouwen dat de client stuurt** (een `playerId`, een score): nooit. De server haalt de identiteit uit de cookie en rekent zelf.
- **Twee spelers in twee gewone tabs**: tabs delen cookies, dus dat is dezelfde speler. Gebruik incognito, een andere browser of je telefoon.
- **Nieuwe npm-package, maar Docker ziet hem niet**: `docker compose up --build -V`. De `-V` maakt het `node_modules`-volume van de frontend opnieuw aan.
