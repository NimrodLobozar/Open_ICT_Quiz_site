# Socket.IO event-contract

Wat er **nu** gebouwd is. Het volledige plan staat in hoofdstuk 8 van het [projectplan](../Quizapp-Projectplan-Codebase.md).

> **Afspraak:** de eventnamen staan in [`backend/socket/events.js`](../backend/socket/events.js) én in de kopie [`src/socket/events.js`](../src/socket/events.js). Verander je er één, pas dan ook de andere en dit bestand aan, in dezelfde PR.

Uitleg over hoe het werkt: [SOCKET-IO-UITLEG.md](SOCKET-IO-UITLEG.md).

## REST: sessies (zetten en wissen cookies)

| Methode + pad | Body | Antwoord | Cookie |
|---|---|---|---|
| `POST /api/games` | – | `201 { gameCode }` | zet `quiz_host` |
| `GET /api/games/:code` | – | `{ exists, locked, phase }` | – |
| `POST /api/games/:code/players` | `{ nickname }` | `201 { playerId, nickname }` | zet `quiz_player` |
| `GET /api/games/:code/me` | – | `{ role: 'player', playerId, nickname }` | leest `quiz_player` |
| `GET /api/games/:code/me?role=host` | – | `{ role: 'host' }` | leest `quiz_host` |
| `DELETE /api/games/:code/players/me` | – | `{ ok: true }` | wist `quiz_player` |

Fouten: `{ error, message }` met status `404 GAME_NOT_FOUND`, `409 NAME_TAKEN`, `400 NAME_INVALID`, `403 LOBBY_LOCKED`, `403 WRONG_PHASE`, `401 NO_SESSION`.

`DELETE …/players/me` verwijdert de speler (naam komt vrij), verbreekt zijn open sockets en stuurt `lobby:update`. De eindstand blijft gelijk: die is bij het podium vastgezet.

## Verbinden

```js
socket.auth = { code: '482913', role: 'player' } // of 'host'
socket.connect()
```

De `sessionMiddleware` leest de bijbehorende cookie uit de handshake. Klopt die niet bij `code` en `role`, dan krijgt de client `connect_error` met `error.message === 'NO_SESSION'`.

Rooms: `482913` (iedereen), `482913:host` (host), `482913:player:<id>` (één speler, alle tabbladen).

## Client → server

Elke actie heeft een ack: `{ ok: true, ... }` of `{ ok: false, error, message }`.

| Event | Van | Payload | Ack |
|---|---|---|---|
| `game:sync` | host/speler | `{}` | `{ ok, state }`, zie hieronder |
| `dev:finish` | host, **alleen development** | `{ bots?: number }` | `{ ok }`; speelt 8 nepvragen en gaat naar `PODIUM` |
| `host:restart` | host | `{}` | `{ ok }`; alleen in fase `PODIUM`, anders `WRONG_PHASE`. Zelfde spelers en namen, scores 0, terug naar `LOBBY` |

### `state` van `game:sync`

```js
{
  code: '482913',
  phase: 'LOBBY' | 'PODIUM' | ...,
  lobby: { players: [{ id, nickname, connected, isVerified }], playerCount, locked },
  me: { playerId, nickname } | null,   // alleen voor spelers
  podium: <zelfde als game:podium> | null,   // alleen in PODIUM
  result: <zelfde als player:result> | null, // alleen in PODIUM, alleen voor spelers
}
```

Zo krijgt een speler na verversen of verbindingsverlies precies hetzelfde eindscherm terug.

## Server → client

| Event | Naar | Payload |
|---|---|---|
| `lobby:update` | room (iedereen) | `{ players: [{ id, nickname, connected, isVerified }], playerCount, locked }` |
| `game:podium` | room (iedereen) | `{ top3, ranking: [{ id, nickname, score, rank, isVerified }], totalQuestions }` |
| `player:result` | room van één speler | zie hieronder |
| `game:restarted` | room (iedereen) | `{}`; direct daarna volgt `lobby:update`. Clients gaan terug naar het lobby-wachtscherm |

### `player:result` (na de laatste vraag)

```js
{
  playerId: 8, nickname: 'Emma',
  rank: 8, playerCount: 12,          // "Emma, jij bent 8e van 12 spelers"
  totalScore: 3720,                  // kaart "Punten"
  correctCount: 5, totalQuestions: 8, // kaart "Goed" → 5/8
  nextRank: 7, pointsToNext: 400,    // kaart "Tot 7e" → 400. Op plek 1: allebei null
  isGuest: true,                     // gastknop en -melding tonen
}
```

`ranking` en `rank` komen uit `getRanking()` ([`src/utils/ranking.js`](../src/utils/ranking.js)), `player:result` uit `buildPlayerResult()` ([`src/utils/playerResult.js`](../src/utils/playerResult.js)). Beide draaien op de server; de client rekent niets na.
