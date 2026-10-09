# Database

> Stand van zaken op 8 oktober 2026 (branch `feature_Eindscherm`, gelijk aan `dev` wat het schema betreft).

## In het kort

- **PostgreSQL 16** in Docker (service `db`), gebruiker/wachtwoord/database: `quiz` / `quiz` / `quiz`, poort `5432`.
- **Prisma 7** met de `@prisma/adapter-pg`-adapter. De client staat in [`backend/db/prisma.js`](../backend/db/prisma.js); importeer altijd díé `prisma`, maak geen tweede `PrismaClient` aan.
- Het schema staat in [`prisma/schema.prisma`](../prisma/schema.prisma). Er zijn **nog geen migraties**: de backend draait bij het opstarten `npx prisma db push` (zie [`Dockerfile.backend`](../Dockerfile.backend)), dat zet de tabellen gelijk aan het schema.
- Er zijn **2 tabellen** en ze zijn allebei **leeg** (0 rijen). Er is nog geen seed.
- De enige query in de code is `SELECT 1` in de health-check ([`backend/routes/health.js`](../backend/routes/health.js)).
- Het eindscherm gebruikt nu nepdata uit [`src/data/dummyDatabase.js`](../src/data/dummyDatabase.js), niet de database.

## Tabellen die nu bestaan

### `Quiz`

Ondanks de naam is dit eigenlijk een **lobby / gespeelde game**: er staat een joincode en een slot op, maar geen vragen.

| Kolom | Type | Regels |
|---|---|---|
| `id` | `integer` | primary key, auto-increment |
| `code` | `text` | **uniek** (de lobbycode, bijv. `482913`) |
| `title` | `text` | verplicht |
| `locked` | `boolean` | standaard `false` |
| `createdAt` | `timestamp(3)` | standaard `now()` |

### `Player`

| Kolom | Type | Regels |
|---|---|---|
| `id` | `integer` | primary key, auto-increment |
| `nickname` | `text` | verplicht (nog **geen** uniek-regel per quiz) |
| `quizId` | `integer` | foreign key → `Quiz.id` (`ON DELETE RESTRICT`) |
| `createdAt` | `timestamp(3)` | standaard `now()` |

**Relatie:** één `Quiz` heeft veel `Player`s. Omdat de foreign key `RESTRICT` is, kun je een `Quiz` pas verwijderen als de spelers eerst weg zijn.

**Wat ontbreekt voor het scoreboard:** er staat **nergens een score**. Er zijn ook geen vragen, antwoorden of resultaten.

## Verschil met het projectplan

Hoofdstuk 12 van het projectplan beschrijft een groter schema. Dit is ervan gebouwd:

| Projectplan | Nu in de database |
|---|---|
| `Quiz` = de vragenset (titel, omschrijving, vragen) | `Quiz` = een lobby met `code` + `locked` (lijkt meer op `GameSession`) |
| `Question`, `AnswerOption` | ontbreekt |
| `GameSession` (code, ronde, start/eind) | ontbreekt, deels vervangen door `Quiz` |
| `GameResult` (nickname, score, rank, correctCount) | ontbreekt |
| `Role`, `User`, `UserRole`, `PlayerAnswer` (later) | ontbreekt |
| (niet in plan) | `Player` (speler in een lobby) |

Let op de **naamverwarring**: als iemand "Quiz" zegt, vraag of ze de vragenset (plan) of de lobby (huidige code) bedoelen. Het is handig om dit met het team recht te trekken voordat er vragen bij komen, bijvoorbeeld door de huidige `Quiz` later te hernoemen naar `GameSession`.

## Wat het scoreboard nodig heeft

Het eindscherm (`Podium` + het nog te bouwen scoreboard) heeft per speler nodig:

```js
{ id, nickname, score, correctCount }  // rank berekent getRanking() zelf
```

Dat is precies de vorm van `gameResults` in `dummyDatabase.js`, zodat je de nepdata straks één-op-één kunt vervangen.

### Voorstel: score op `Player` zetten (kleinste stap)

De snelste weg naar een echt scoreboard met wat er al is: twee kolommen aan `Player` toevoegen.

```prisma
model Player {
  id           Int      @id @default(autoincrement())
  nickname     String
  quiz         Quiz     @relation(fields: [quizId], references: [id])
  quizId       Int
  score        Int      @default(0) // totaal aantal punten in deze game
  correctCount Int      @default(0) // aantal goede antwoorden, voor "7/8 goed" op het eindscherm
  createdAt    DateTime @default(now())

  // Twee spelers met dezelfde naam in één lobby is verwarrend op het scoreboard.
  @@unique([quizId, nickname])
}
```

Daarna: `docker compose up --build backend` (de backend doet `prisma db push` bij het starten) of lokaal `npx prisma db push`.

**Bewust géén `rank`-kolom:** de plek wordt altijd berekend met `getRanking()` uit [`src/utils/ranking.js`](../src/utils/ranking.js). Zo kunnen podium, scoreboard en database het nooit oneens zijn. Zie ook `CLAUDE.md`.

> Alternatief volgens het projectplan: een aparte tabel `GameResult` die pas aan het eind van de game gevuld wordt, terwijl de scores tijdens het spel in het geheugen van de server staan. Dat is netter als je later "opnieuw spelen" (meerdere rondes) wilt bewaren. Begin gerust met het voorstel hierboven en stap later over; de vorm van de data voor het eindscherm blijft hetzelfde.

## Queries voor het eindscherm

Alle voorbeelden gaan uit van het voorstel hierboven (`score` en `correctCount` op `Player`).

### Prisma (in de backend)

```js
import { prisma } from '../db/prisma.js'
import { getRanking } from '../../src/utils/ranking.js'

// Uitslag van één lobby ophalen via de code die spelers ook intypen.
export async function getResults(code) {
  const quiz = await prisma.quiz.findUnique({
    where: { code },
    select: {
      id: true,
      title: true,
      players: {
        // Alleen de velden die het eindscherm nodig heeft, zodat er niets extra's uitlekt.
        select: { id: true, nickname: true, score: true, correctCount: true },
      },
    },
  })

  if (!quiz) return null

  // De database sorteert niet: getRanking doet sorteren én plekken, net als in de frontend.
  return { title: quiz.title, ranking: getRanking(quiz.players) }
}
```

Waarom `getRanking` op de server importeren uit `src/`? Het is gewoon JavaScript zonder React, dus Node kan het ook draaien. Eén bestand = één waarheid.

> **Let op bij Docker:** [`Dockerfile.backend`](../Dockerfile.backend) kopieert nu alleen `backend/` en `prisma/`. Voeg `COPY src/utils ./src/utils` toe, anders vindt de backend-container `ranking.js` niet.

**Score bijwerken na een antwoord:**

```js
await prisma.player.update({
  where: { id: playerId },
  data: {
    // increment voorkomt dat twee gelijktijdige updates elkaar overschrijven.
    score: { increment: pointsGained },
    correctCount: { increment: correct ? 1 : 0 },
  },
})
```

**Alle scores tegelijk opslaan aan het eind** (als je de scores tijdens het spel in het geheugen bijhoudt):

```js
// $transaction: of alles wordt opgeslagen, of niets. Geen half scoreboard.
await prisma.$transaction(
  players.map((player) =>
    prisma.player.update({
      where: { id: player.id },
      data: { score: player.score, correctCount: player.correctCount },
    }),
  ),
)
```

**Lobby + spelers aanmaken** (handig om te testen):

```js
const quiz = await prisma.quiz.create({
  data: {
    code: '482913',
    title: 'ICT algemeen',
    players: {
      create: [
        { nickname: 'Sanne', score: 7420, correctCount: 8 },
        { nickname: 'Mo', score: 6150, correctCount: 7 },
        { nickname: 'Fatima', score: 6150, correctCount: 7 },
      ],
    },
  },
})
```

### SQL (om zelf in de database te kijken)

Openen:

```bash
docker compose exec db psql -U quiz -d quiz
```

Tabelnamen met hoofdletters moeten tussen dubbele quotes (`"Player"`), anders zoekt Postgres naar `player`.

```sql
-- Welke tabellen zijn er, en hoe zien ze eruit?
\dt
\d "Player"

-- Hoeveel rijen?
SELECT COUNT(*) FROM "Quiz";
SELECT COUNT(*) FROM "Player";

-- Scoreboard van één lobby. RANK() geeft gelijke scores dezelfde plek (1, 2, 2, 4),
-- precies zoals getRanking().
SELECT
  RANK() OVER (ORDER BY p.score DESC) AS rank,
  p.nickname,
  p.score,
  p."correctCount"
FROM "Player" p
JOIN "Quiz" q ON q.id = p."quizId"
WHERE q.code = '482913'
ORDER BY p.score DESC, p.nickname;
```

De SQL-versie is om te controleren, niet om in de app te gebruiken: Postgres sorteert namen soms net iets anders dan JavaScript (`localeCompare`), en dan zou de volgorde bij gelijke scores verschillen van het podium.

## Handige commando's

| Wat | Commando |
|---|---|
| Database bekijken in de browser | `npx prisma studio` (lokaal, met `DATABASE_URL` in `.env` naar `localhost:5432`) |
| Schema naar de database zetten | `npx prisma db push` |
| Prisma-client opnieuw genereren na een schemawijziging | `npm run prisma:generate` |
| Alles leeg en opnieuw | `docker compose down -v` en daarna `docker compose up --build` |
