# Quizapp — Projectplan & Codebase-opzet

> **Voor wie:** het squad (HU Software Engineering) én Claude Code.
> **Doel van dit document:** één bron van waarheid voor wát we bouwen, hóe de codebase eruitziet en in welke volgorde alles gebouwd wordt.
> **Opdracht nu:** de **basis-codebase** opzetten (skeleton) waarmee het team meteen kan starten. Het team bouwt daarna zelf de MVP-features.
> **Laatst bijgewerkt:** 6 oktober 2026

---

## 0. Instructie voor Claude Code (lees dit eerst)

1. Lees dit hele document voordat je code schrijft.
2. Voer **Hoofdstuk 9 — Bouwvolgorde, Fase 0 t/m 2** uit. Dat is de skeleton-opdracht. Stop daarna en geef een samenvatting.
3. Fase 3 en verder (de MVP-features) bouw je **alleen** als daar expliciet om gevraagd wordt; die zijn bedoeld voor het team.
4. Alles moet draaien met **alleen Docker Desktop + Git** op de laptop. Er mag niets lokaal geïnstalleerd hoeven worden (geen Node, geen PHP, geen Postgres).
5. Houd de code **simpel en leesbaar voor beginners**: JavaScript (géén TypeScript), korte bestanden, Nederlandstalige commentaar bij lastige stukken, Engelse namen voor variabelen/functies/bestanden.
6. Zet overal waar het team verder moet bouwen een duidelijke `// TODO(team): ...` met uitleg.
7. **Sessies gaan uitsluitend via httpOnly-cookies** (hoofdstuk 6.1). Gebruik nergens `localStorage` of `sessionStorage` om te onthouden wie iemand is.
8. Maak een `CLAUDE.md` in de root met een korte samenvatting van dit document (stack, mappen, commando's, conventies) zodat toekomstige Claude Code-sessies het meteen snappen. Kopieer dit plan ook naar `docs/PROJECTPLAN.md`.

---

## 1. Het product in één alinea

Een **Kahoot-achtige quizwebsite voor school**. Een host (docent/student) kiest een quiz en opent een lobby op het digibord. Spelers joinen met een **QR-code of een ingetypte code** en een **unieke naam**. De host start de quiz, iedereen beantwoordt vragen op zijn telefoon, na elke vraag zie je de tussenstand en aan het eind een **podium met de top 3**. Later krijgen spelers een **account** met **beroepsrollen** (AI engineering, frontend, backend, cybersecurity, IT/business…). Die rollen worden in de lobby getoond, zodat studenten uit de drie tribes/klassen weten wie ze ergens over kunnen aanspreken. Een algoritme maakt de quiz moeilijker of makkelijker op basis van prestaties.

**Waarom:** de drie tribes communiceren nauwelijks met elkaar en stellen elkaar weinig vragen. De quiz maakt zichtbaar wie waar goed in is en verlaagt de drempel om elkaar te benaderen.

---

## 2. Gekozen tech stack (en waarom)

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Frontend | **React** + **Vite** (JavaScript) | Afgesproken in het team. Vite is snel en simpel. |
| UI-library | **Ant Design (antd)** | Kant-en-klare knoppen, formulieren, tabellen, modals, zodat alle pagina's er hetzelfde uitzien terwijl iedereen zijn eigen pagina bouwt. |
| Routing | **React Router** | Standaard voor meerdere pagina's in React. |
| QR-code | **qrcode.react** | Eén component, klaar. |
| Backend | **Node.js** + **Express** | Zelfde taal als de frontend: het team leert maar één taal. |
| Realtime | **Socket.IO** | Lobby's = "rooms", automatisch reconnecten, events in twee richtingen. Precies wat een Kahoot-kloon nodig heeft. |
| Database | **PostgreSQL** | Standaard, robuust, draait makkelijk in Docker. |
| ORM | **Prisma** | Database-schema in één leesbaar bestand, migraties en seed-data ingebouwd, makkelijk te leren. |
| Containers | **Docker + Docker Compose** | Eén commando start alles. Niemand hoeft Node/Postgres te installeren, dus geen "werkt op mijn laptop"-gedoe. |
| Versiebeheer | **Git + GitHub** | Feature branches + Pull Requests. |
| Kwaliteit | **ESLint + Prettier**, **Vitest** voor de game-logica | Consistente code, en tests voor de lastige regels (namen, punten). |

**Waarom niet Laravel/PHP:** het opzetten van Laravel op een gereset laptop kostte veel tijd (Composer, PHP-extensies, enz.). Realtime/WebSockets in PHP vraagt bovendien extra losse software. Met deze stack heeft iedereen alleen **Docker Desktop, Git en VS Code** nodig.

**Versies:** gebruik de actuele stabiele (LTS-)versies op het moment van opzetten. Richtlijn: Node 24 LTS (`node:24-alpine`), PostgreSQL 17 (`postgres:17-alpine`), React 19, Ant Design 5+, Socket.IO 4. Vereist de actuele Prisma-versie een `prisma.config`-bestand of een andere generator-syntax, volg dan de officiële Prisma-docs.

---

## 3. User flow (MVP)

### 3.1 Host

1. Opent de site → kiest **"Quiz hosten"**.
2. Komt op de **quiz-overzichtspagina**: lijst met quizzen + zoekbalk. Klikt op een quiz → **"Host"**.
3. **Instellingen-pagina** (klein): max. aantal spelers, tijd per vraag, vraagmodus (zie 3.4). Klikt **"Lobby openen"**.
4. **Lobby-scherm** (bedoeld voor het digibord):
   - Grote **joincode** (6 cijfers, bijv. `482913`) + **QR-code** + de join-URL in tekst.
   - Live lijst van gejoinde spelers (naam + later account-icoon/beroepsrollen).
   - Knop **"Lobby op slot"** / **"Lobby openen"**: op slot = geen *nieuwe* spelers meer, wel rejoins.
   - Knop **"Start quiz"** (pas actief bij ≥ 1 speler).
5. **Vraag-scherm**: vraag, antwoordopties, timer, teller "x van y heeft geantwoord".
6. **Resultaat per vraag**: juiste antwoord + hoeveel mensen wat kozen.
7. **Tussenstand**: ranglijst (top 5–10) met punten en stijging/daling. Knop **"Volgende vraag"**.
8. Herhalen tot de laatste vraag.
9. **Podium**: plek 1, 2 en 3 groot in beeld.
10. Knoppen: **"Quiz herstarten"** (zelfde lobby, zie 3.3) of **"Afsluiten"**.

### 3.2 Speler (zonder account)

1. Scant de **QR-code** → komt op `/join/482913` (code al ingevuld), **of** gaat naar `/join` en typt de **code van 6 cijfers** in.
   - Het invoerveld accepteert alleen cijfers (`inputMode="numeric"`, zodat telefoons het cijfertoetsenbord tonen) en precies 6 tekens. Een onbekende code geeft de melding "Deze code bestaat niet".
2. Vult zijn **naam** in → **"Join"**.
   - Naam moet **uniek binnen die lobby** zijn (zie hoofdstuk 5). Bezet → foutmelding, andere naam kiezen.
   - Lobby op slot → melding "Deze lobby is gesloten".
3. **Wachtscherm**: "Je zit erin! Wacht tot de host start" + eigen naam.
4. **Vraag**: speler ziet de vraag + antwoordknoppen op zijn telefoon (vraagtekst ook tonen, zodat je niet per se naar het bord hoeft te kijken).
5. **Na de vraag**: goed/fout, punten erbij, huidige plek.
6. **Eindscherm**:
   - Groot: **"Je bent #7 van 24"** + eigen score.
   - Daaronder een **scrollbaar scorebord** met iedereen, waarbij de eigen rij gemarkeerd is en automatisch in beeld scrolt (je ziet wie boven en onder je staat).
   - Knop **"Opnieuw spelen"** → speler verlaat de lobby en gaat terug naar `/join` (nieuwe code/naam invoeren).

### 3.3 Rejoin & herstart

- **Rejoin via cookie:** sluit een speler per ongeluk het tabblad of de hele browser, dan kan hij terugkomen, **ook als de lobby op slot zit**. Bij joinen zet de server een httpOnly-cookie `quiz_player` met een geheime sessietoken (4 uur geldig). Opent hij de join-link of de site opnieuw, dan herkent de server hem aan die cookie en zit hij meteen weer in de game met zijn oude naam en score, zonder iets in te vullen. Hoe dit technisch werkt: hoofdstuk 6.1.
- Hetzelfde geldt voor de **host**: die krijgt een cookie `quiz_host`. Ververst of sluit de host de pagina per ongeluk, dan krijgt hij zijn lobby terug.
- Een speler die wegvalt, blijft in de lijst staan (status "offline", grijs) en kan op elk moment terugkomen.
- **Host herstart de quiz:** alle spelers blijven in de lobby, scores gaan naar 0, iedereen komt terug op het lobby-wachtscherm zonder opnieuw te joinen. De host kan de lobby dan weer openzetten voor nieuwe mensen. (Later: bij een herstart wordt de moeilijkheid aangepast op basis van de vorige ronde.)

### 3.4 Discussiepunt: vraagmodus

Nog te beslissen met het team. Daarom komt er een **instelling** `questionPreviewSeconds`:
- `0` → vraag + antwoorden verschijnen meteen, je kunt direct antwoorden.
- `> 0` (bijv. 5) → eerst alleen de vraag (leestijd), daarna pas de antwoordknoppen.

De skeleton ondersteunt beide; het team bepaalt de standaardwaarde.

### 3.5 Later: speler mét account

- Ingelogd + joincode → direct in de lobby met zijn accountnaam (geen naam intypen).
- Krijgt een **verified/account-icoontje** achter zijn naam. Gasten krijgen niets.
- Beroepsrollen van het account worden in de lobby getoond (hoe precies: zie Open punten).

---

## 4. Scope: wat zit in de MVP en wat niet

### MVP (moet werken)

- Quiz-overzicht met zoeken (quizzen komen uit de database via seed-data).
- Host maakt lobby aan met code + QR.
- Spelers joinen met code/QR + unieke naam.
- Live spelerslijst, lobby op slot, rejoin na wegklikken.
- Vragen met timer, antwoorden, puntentelling.
- Tussenstand na elke vraag, podium aan het eind.
- Eindscherm speler: eigen plek + scrollbaar scorebord.
- Host: quiz herstarten met dezelfde lobby. Speler: opnieuw spelen.
- Eindresultaten opslaan in de database.

### Niet in de MVP (later)

- Accounts (registreren, inloggen, accountbeheer).
- Beroepsrollen op je profiel + tonen in de lobby.
- Adaptieve moeilijkheid (algoritme).
- Persoonlijk profiel met voortgang/statistieken.
- Quiz-editor (quizzen maken via de site i.p.v. seed-bestand).
- Hosting/deployment op een echte server.

---

## 5. Regels voor namen (belangrijk)

Één bestand `server/src/game/nameRules.js` met unit tests.

1. **Normaliseren:** spaties aan begin/eind weg, dubbele spaties → één spatie.
2. **Lengte:** 2–20 tekens. Alleen letters, cijfers, spaties, `-`, `_`, `.` (inclusief letters met accenten zoals é, ö).
3. **Uniek per lobby, hoofdletterongevoelig:** "Nimród", "nimród" en " NIMRÓD " zijn dezelfde naam.
4. **Wie het eerst komt, houdt de naam.** Geen van beide spelers wordt ooit uit de lobby gegooid vanwege een naamconflict:
   - Gast "Sam" zit erin → een andere gast "sam" wil joinen → **geweigerd** (`NAME_TAKEN`), moet een andere naam kiezen.
   - (Later) Gast "Sam" zit erin → account "Sam" wil joinen → account-speler moet in deze lobby een andere weergavenaam kiezen; de gast blijft. *(Te bevestigen met het team, zie Open punten.)*
   - (Later) Account "Sam" zit erin → gast "Sam" wil joinen → **geweigerd**.
5. **Rejoin** met een geldige sessiecookie telt niet als nieuwe naam: je krijgt je eigen naam gewoon terug.
6. Een speler die de lobby **zelf verlaat** ("Opnieuw spelen") geeft zijn naam vrij.

---

## 6. Architectuur

```
 Telefoon (speler)          Digibord (host)
        │                          │
        └────── browser ───────────┘
                    │  http://<host>:5173
          ┌─────────▼─────────┐
          │  client (Vite)    │  React + antd
          │  proxy /api  ───────────┐
          │  proxy /socket.io ──────┤
          └───────────────────┘     │
                          ┌─────────▼─────────┐
                          │ server (Node)     │  Express (REST) + Socket.IO (realtime)
                          │ GameManager       │  actieve games in geheugen
                          └─────────┬─────────┘
                                    │ Prisma
                          ┌─────────▼─────────┐
                          │ db (PostgreSQL)   │  quizzen, resultaten, (later) users
                          └───────────────────┘
```

**Belangrijke ontwerpkeuzes:**

- **Actieve games leven in het geheugen van de server** (een `Map` van gamecode → `Game`-object). Dat is snel en simpel. Pas aan het eind van een game worden de **resultaten in de database** opgeslagen. Gevolg: herstart de server, dan zijn lopende games weg. Dat is acceptabel voor de MVP.
- **De server is de baas** (server-authoritative): de server houdt de timer bij, controleert antwoorden en berekent punten. De client stuurt alleen "ik kies optie X". Clients krijgen **nooit** te zien welk antwoord juist is vóórdat de vraag afgelopen is (anders kun je valsspelen via DevTools).
- **Vite-proxy:** de browser praat alleen met poort 5173; Vite stuurt `/api` en `/socket.io` door naar de server. Daardoor geen CORS-gedoe, en telefoons hebben maar één adres nodig.
- **REST vs Socket.IO:** REST (`/api/...`) voor alles wat een sessie start of beëindigt (game aanmaken, joinen, verlaten, later inloggen), omdat alleen een HTTP-antwoord een cookie kan zetten. Daarnaast REST voor gewone data (quizlijst). Socket.IO voor alles wat live is (lobby, vragen, antwoorden, scores).
- **Sessies via cookies:** één mechanisme voor gasten, hosts en (later) accounts. Zie 6.1.

### 6.1 Sessies & rejoin via httpOnly-cookies

**Waarom cookies:** we bouwen dit één keer, zodat het ook werkt als accounts erbij komen. Een httpOnly-cookie kan niet door JavaScript gelezen worden (veiliger), wordt automatisch meegestuurd en blijft bewaard als de browser sluit.

**De cookies**

| Cookie | Voor | Inhoud | Geldig |
|---|---|---|---|
| `quiz_player` | speler in een game | willekeurige sessietoken | 4 uur |
| `quiz_host` | host van een game | willekeurige sessietoken | 4 uur |
| `quiz_auth` | (later, L1) ingelogd account | JWT of sessietoken | 7 dagen |

**Instellingen (voor alle cookies hetzelfde, via één helper `server/src/utils/cookies.js`):**
- `httpOnly: true`: JavaScript kan er niet bij.
- `sameSite: 'lax'`
- `path: '/'`
- `maxAge`: altijd zetten. **Zonder `maxAge` wordt het een sessiecookie die verdwijnt als de browser sluit**, en dan werkt rejoinen niet.
- `secure: true` alleen als `NODE_ENV === 'production'` (HTTPS). In development werkt alles over `http://` en het LAN-IP.

**Regels**
- In de cookie staat **alleen een willekeurige token** (`crypto.randomBytes(32).toString('base64url')`), nooit een naam, score of id. Anders kan iemand via DevTools de plek van een ander overnemen.
- De server houdt in `GameManager` een `Map` bij: `token → { gameCode, playerId, role }`. Die verwijzing verdwijnt als de game wordt opgeruimd of de speler zelf vertrekt.
- Eén speler-cookie per browser: joint iemand een nieuwe game, dan wordt de oude `quiz_player` overschreven.

**Flow: joinen**
1. Speler vult code + naam in → `POST /api/games/:code/players` met `{ nickname }`.
2. Server checkt de naam (hoofdstuk 5), maakt de speler aan, zet de cookie `quiz_player` en antwoordt `{ playerId, nickname }`.
3. Client gaat naar `/play/:code` en verbindt de socket. De browser stuurt de cookie automatisch mee bij de Socket.IO-handshake (zelfde origin dankzij de Vite-proxy).
4. Socket.IO-middleware (`io.use`) leest de cookie uit `socket.request.headers.cookie` (package `cookie`), zoekt de sessie op, zet `socket.data = { gameCode, playerId, role }`, laat de socket de room joinen en markeert de speler als `connected`.

**Flow: rejoin**
1. Speler opent `/join/:code` of `/play/:code` opnieuw → client roept `GET /api/games/:code/me` aan.
2. Geldige cookie voor deze game → `{ role: 'player', playerId, nickname }` → client gaat direct naar `/play/:code` en de socket koppelt hem automatisch weer (stap 4 hierboven). Lobby op slot maakt niet uit.
3. Geen of ongeldige cookie → `401 NO_SESSION` → normaal joinformulier tonen.
4. Hetzelfde voor de host op `/host/:code` met `quiz_host`.

**Flow: verlaten ("Opnieuw spelen")**
- `DELETE /api/games/:code/players/me` → server verwijdert de speler en de token, wist de cookie (`res.clearCookie`) en de naam komt vrij.

**Later met accounts (L1):** `quiz_auth` gebruikt dezelfde helper. Bij `POST /api/games/:code/players` kijkt de server of er een geldige `quiz_auth` is. Zo ja, dan wordt de accountnaam gebruikt en krijgt de speler `isVerified: true`. De game-sessie blijft gewoon `quiz_player`, dus het rejoin-mechanisme hoeft niet aangepast te worden.

**Bekende grenzen (geaccepteerd):**
- Rejoinen werkt alleen op hetzelfde apparaat en in dezelfde browser.
- Incognito: de cookie verdwijnt als alle incognitovensters gesloten zijn.
- Server herstart → lopende games zijn weg, dus cookies wijzen nergens meer naar (de server geeft `NO_SESSION`).
- **Testen:** tabbladen in dezelfde browser delen cookies. Twee spelers testen op één laptop kan dus niet met twee gewone tabs: gebruik een incognitovenster, een andere browser of je telefoon. (Host + één speler in dezelfde browser kan wel, want dat zijn twee verschillende cookies.)
- Functionele cookies die nodig zijn om het spel te laten werken, hebben geen cookiebanner of toestemming nodig.

---

## 7. Mappenstructuur

```
quizapp/
├── docker-compose.yml
├── .env.example                 # kopiëren naar .env
├── .gitignore
├── .gitattributes               # * text=auto eol=lf  (voorkomt Windows-regeleinde-problemen in Docker)
├── .editorconfig
├── README.md                    # hoe start je alles (zie hoofdstuk 11)
├── CONTRIBUTING.md              # git-workflow, branches, PR-regels, code-stijl
├── CLAUDE.md                    # korte samenvatting voor Claude Code
├── docs/
│   ├── PROJECTPLAN.md           # dit document
│   ├── SOCKET-EVENTS.md         # het event-contract (hoofdstuk 8)
│   └── IDEEEN.md                # ideeënlijst (hoofdstuk 14)
│
├── client/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js           # proxy + polling voor Docker op Windows
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # routes
│       ├── theme.js             # antd ConfigProvider-thema (kleuren, font)
│       ├── api/
│       │   └── http.js          # fetch-helper voor /api
│       ├── socket/
│       │   ├── socket.js        # één gedeelde socket.io-client
│       │   └── events.js        # event-namen (KOPIE van server/src/constants/events.js)
│       ├── hooks/
│       │   ├── useSocketEvent.js
│       │   └── useGameSession.js     # vraagt GET /api/games/:code/me (wie ben ik in deze game?)
│       ├── components/
│       │   ├── layout/AppLayout.jsx
│       │   ├── JoinQrCode.jsx
│       │   ├── PlayerList.jsx
│       │   ├── QuestionTimer.jsx
│       │   ├── AnswerButtons.jsx
│       │   ├── Leaderboard.jsx
│       │   ├── Podium.jsx
│       │   └── Scoreboard.jsx        # scrollbaar, eigen rij gemarkeerd
│       └── pages/
│           ├── HomePage.jsx           # "Hosten" of "Joinen"
│           ├── QuizBrowsePage.jsx     # zoeken + lijst
│           ├── HostSetupPage.jsx      # instellingen
│           ├── HostGamePage.jsx       # lobby → vragen → tussenstand → podium
│           ├── JoinPage.jsx           # code + naam
│           ├── PlayerGamePage.jsx     # wachten → vraag → resultaat → eindscherm
│           ├── SocketTestPage.jsx     # alleen dev: ping/pong-test
│           └── NotFoundPage.jsx
│
└── server/
    ├── Dockerfile
    ├── package.json
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.js              # voorbeeldquizzen + beroepsrollen
    ├── src/
    │   ├── index.js             # Express + HTTP + Socket.IO starten
    │   ├── config.js            # env-variabelen op één plek
    │   ├── db/prisma.js         # één PrismaClient
    │   ├── routes/
    │   │   ├── health.js        # GET /api/health
    │   │   ├── quizzes.js       # GET /api/quizzes?search=, GET /api/quizzes/:id
    │   │   └── games.js         # aanmaken, joinen, /me, verlaten (zet/wist cookies, zie 6.1)
    │   ├── utils/
    │   │   └── cookies.js       # setSessionCookie / clearSessionCookie / readSession
    │   ├── constants/events.js  # alle socket-eventnamen
    │   ├── socket/
    │   │   ├── index.js         # koppelt handlers aan io
    │   │   ├── sessionMiddleware.js  # leest cookie bij handshake → socket.data + room
    │   │   ├── hostHandlers.js
    │   │   └── playerHandlers.js
    │   └── game/
    │       ├── GameManager.js   # Map<code, Game>, codes genereren, opruimen
    │       ├── Game.js          # state machine van één game
    │       ├── phases.js        # LOBBY, QUESTION_PREVIEW, ...
    │       ├── scoring.js       # puntenberekening
    │       ├── nameRules.js     # naamvalidatie + uniekheid
    │       └── codeGenerator.js # joincode van 6 cijfers maken (uniek onder actieve games)
    └── tests/
        ├── nameRules.test.js
        ├── scoring.test.js
        └── Game.test.js
```

**Routes (React Router):** `/` → HomePage · `/quizzes` → QuizBrowsePage · `/host/new/:quizId` → HostSetupPage · `/host/:code` → HostGamePage · `/join` en `/join/:code` → JoinPage · `/play/:code` → PlayerGamePage · `/dev/socket` → SocketTestPage · `*` → NotFoundPage.

**Afspraak `events.js`:** client en server hebben elk een eigen kopie (de Docker-builds zijn gescheiden). Wijzig je een eventnaam, pas dan **beide** bestanden én `docs/SOCKET-EVENTS.md` aan in dezelfde PR.

---

## 8. Socket.IO event-contract

Alle namen staan als constanten in `events.js`. Elke actie van de client gebruikt een **acknowledgement-callback** `(response) => {}` met `{ ok: true, ... }` of `{ ok: false, error: 'CODE', message: '...' }`.

### 8.0 REST-endpoints voor sessies (zetten/wissen cookies, zie 6.1)

| Methode + pad | Body | Antwoord | Cookie |
|---|---|---|---|
| `POST /api/games` | `{ quizId, settings: { maxPlayers, timePerQuestion, questionPreviewSeconds } }` | `{ gameCode }` | zet `quiz_host` |
| `GET /api/games/:code` | – | `{ exists, locked, phase }` (voor het joinformulier) | – |
| `POST /api/games/:code/players` | `{ nickname }` | `{ playerId, nickname }` of `{ error }` | zet `quiz_player` |
| `GET /api/games/:code/me` | – | `{ role: 'host' \| 'player', playerId?, nickname? }` of `401 NO_SESSION` | leest beide |
| `DELETE /api/games/:code/players/me` | – | `{ ok: true }` | wist `quiz_player` |

Fouten geven een passende HTTP-status (`404 GAME_NOT_FOUND`, `409 NAME_TAKEN`, `403 LOBBY_LOCKED`, …) met body `{ error, message }`.

**Verbinden:** de client verbindt de socket pas ná een geslaagde aanmaak/join/`me`-check. De `sessionMiddleware` koppelt de socket aan de juiste game en rol. Er zijn dus geen aparte socket-events voor joinen of rejoinen.

### 8.1 Client → Server (Socket.IO)

| Event | Van | Payload | Antwoord (ack) |
|---|---|---|---|
| `host:lock` | host | `{ locked: true/false }` | `{ ok }` |
| `host:kick` | host | `{ playerId }` *(optioneel, nice-to-have; server maakt de token van die speler ongeldig)* | `{ ok }` |
| `host:start` | host | `{}` | `{ ok }` |
| `host:next` | host | `{}` (naar volgende fase/vraag) | `{ ok }` |
| `host:restart` | host | `{}` | `{ ok }` |
| `host:end` | host | `{}` (lobby sluiten) | `{ ok }` |
| `player:answer` | speler | `{ questionIndex, optionId }` | `{ ok }` (géén goed/fout hier) |
| `game:sync` | host/speler | `{}` (vraag na (her)verbinden de huidige toestand op) | `{ ok, state }` |

**Foutcodes:** `GAME_NOT_FOUND`, `LOBBY_LOCKED`, `LOBBY_FULL`, `NAME_TAKEN`, `NAME_INVALID`, `ALREADY_ANSWERED`, `TOO_LATE`, `NOT_HOST`, `NO_SESSION`, `WRONG_PHASE`.

### 8.2 Server → Client

| Event | Naar | Payload |
|---|---|---|
| `lobby:update` | iedereen in room | `{ players: [{ id, nickname, connected, isVerified, roles: [] }], locked, playerCount }` |
| `game:phase` | iedereen | `{ phase, questionIndex, totalQuestions }` |
| `question:show` | iedereen | `{ index, total, text, options: [{ id, text }], timeLimitSec, previewSeconds, startsAt }` (**zonder** `isCorrect`) |
| `question:progress` | host | `{ answeredCount, playerCount }` |
| `question:end` | iedereen | `{ correctOptionId, answerCounts: { [optionId]: n } }` |
| `player:result` | één speler | `{ correct, pointsGained, totalScore, rank }` |
| `leaderboard:show` | iedereen | `{ top: [{ nickname, score, rankChange }] }` |
| `game:podium` | iedereen | `{ top3: [...], ranking: [{ rank, nickname, score, isVerified }] }` |
| `game:restarted` | iedereen | `{}` → terug naar lobby, scores 0 |
| `game:closed` | iedereen | `{ reason }` → speler terug naar `/join` |
| `error` | één client | `{ error, message }` |

### 8.3 Game-fases (state machine in `Game.js`)

```
LOBBY ──host:start──▶ QUESTION_PREVIEW ──(timer)──▶ QUESTION_ACTIVE
  ▲                     (overslaan als previewSeconds = 0)        │
  │                                              timer op OF iedereen geantwoord
  │                                                               ▼
  │                                                       QUESTION_RESULT
  │                                                               │ host:next
  │                                                               ▼
  │                                                         LEADERBOARD
  │                                       host:next ┌─────────────┴─────────────┐
  │                                                 ▼                           ▼
  │                                     (volgende vraag)                  laatste vraag?
  │                                     QUESTION_PREVIEW                      PODIUM
  └──────────────────────────── host:restart ─────────────────────────────────┘
```

### 8.4 Rooms

- Room-naam = gamecode (bijv. `482913`). Host en spelers zitten in dezelfde room.
- Extra room `482913:host` alleen voor de host (voor `question:progress`).
- `socket.data` bewaart `{ gameCode, playerId, role: 'host' | 'player' }`.
- Bij `disconnect`: speler → `connected: false` + `lobby:update`. Een game zonder host-verbinding wordt na 10 minuten opgeruimd door `GameManager`.

---

## 9. Bouwvolgorde

### Fase 0 — Repo & Docker-skelet (SKELETON, Claude Code doet dit)

1. Git-repo met `.gitignore` (node_modules, .env, dist), `.gitattributes` (`* text=auto eol=lf`), `.editorconfig`.
2. `client/`: Vite + React (JavaScript), antd, react-router-dom, socket.io-client, qrcode.react. ESLint + Prettier.
3. `server/`: Express, socket.io, @prisma/client + prisma, cookie-parser, cookie, nodemon, vitest, dotenv. ESLint + Prettier. ES modules (`"type": "module"`).
4. `docker-compose.yml`, Dockerfiles en `.env.example` volgens hoofdstuk 10.
5. `GET /api/health` → `{ status: 'ok', db: 'ok' }` (doet een simpele query op de database).
6. `SocketTestPage` (`/dev/socket`): knop "Ping" → server antwoordt `pong` met servertijd.
7. **Klaar als:** `docker compose up --build` op een schone machine alles start; `http://localhost:5173` toont de homepage; `/api/health` geeft `ok`; ping/pong werkt; een wijziging in een `.jsx`- of server-bestand wordt automatisch herladen (ook op Windows).

### Fase 1 — Database & quiz-API (SKELETON, Claude Code doet dit)

1. `prisma/schema.prisma` volgens hoofdstuk 12 (MVP-tabellen actief, latere tabellen al aanwezig zodat er later geen grote migratie nodig is).
2. Eerste migratie `init`.
3. `seed.js` (idempotent met `upsert`): de 6 beroepsrollen + **3 voorbeeldquizzen** van ±8 vragen (bijv. "Web basics", "Netwerken & security", "ICT algemeen") met elk 4 opties, één correct, verschillende `difficulty` (1–3).
4. `GET /api/quizzes?search=` (titel/omschrijving, hoofdletterongevoelig) en `GET /api/quizzes/:id` (**zonder** `isCorrect` in de response).
5. `QuizBrowsePage` toont de lijst met antd `Card`s en een `Input.Search`.
6. **Klaar als:** de seed draait automatisch bij het opstarten, de quizlijst is zichtbaar en zoeken werkt.

### Fase 2 — Frontend-skelet & game-skelet (SKELETON, Claude Code doet dit)

1. Alle routes uit hoofdstuk 7 als pagina's met antd-layout, titel en een `TODO(team)`-blok dat beschrijft wat de pagina moet doen (verwijs naar de flow in hoofdstuk 3).
2. `AppLayout` met header (logo/titel, link naar home), responsive (mobiel eerst).
3. `theme.js`: één plek voor kleuren/fonts via antd `ConfigProvider`.
4. `socket.js` (verbindt pas na een geslaagde sessie-check, `autoConnect: false`), `useSocketEvent`-hook, `useGameSession`-hook (roept `GET /api/games/:code/me` aan).
5. Server: `events.js`, `phases.js`, `GameManager` (codes genereren, games bewaren/opruimen) en een `Game`-klasse met **alle methodes als stubs** (`addPlayer`, `rejoin`, `lock`, `start`, `submitAnswer`, `nextPhase`, `restart`, `getRanking`…) met JSDoc-commentaar over wat ze moeten doen.
6. **Volledig werkend implementeren (als voorbeeld voor het team):** `nameRules.js` + tests, `scoring.js` + tests, `codeGenerator.js` (6 willekeurige cijfers, `100000`–`999999`, opnieuw genereren als de code al in gebruik is), het **volledige sessie-mechanisme uit 6.1** (`cookies.js`, `games.js`-routes, `sessionMiddleware.js`, rejoin voor host en speler) + `lobby:update`. Zo zie je één compleet stuk van client → server → alle clients.
7. `docs/SOCKET-EVENTS.md` (hoofdstuk 8) en `docs/IDEEEN.md` (hoofdstuk 14).
8. `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`.
9. **Klaar als:** host kan een lobby maken en ziet code + QR; een tweede browser (of incognitovenster) kan joinen; de naam verschijnt live bij de host; een dubbele naam wordt geweigerd; browser sluiten en de join-link opnieuw openen zet de speler terug in de lobby (ook als die op slot zit); `docker compose exec server npm test` is groen.

> **Einde skeleton-opdracht.** Vanaf hier bouwt het team, één feature per branch.

### Fase 3 — Lobby afmaken (team)
- Lobby op slot/open, offline-status (grijs) bij disconnect, max. spelers, (optioneel) speler kicken. Het rejoin-mechanisme zelf staat al in de skeleton.

### Fase 4 — Game loop (team)
- Start, preview/actief, timer op de server (`setTimeout`, met `startsAt` naar clients voor de aftelling), antwoorden ontvangen, vraag eindigt als de tijd op is óf iedereen geantwoord heeft, `question:end` + `player:result`.

### Fase 5 — Scores, tussenstand, podium, eindscherm (team)
- `leaderboard:show` met `rankChange`, `Podium`-component (host), `Scoreboard`-component (speler, eigen rij gemarkeerd + auto-scroll).

### Fase 6 — Herstart & opnieuw spelen (team)
- `host:restart` (zelfde spelers, scores 0, terug naar LOBBY) en verlaten via `DELETE /api/games/:code/players/me` (naam vrijgeven, cookie wissen, terug naar `/join`).

### Fase 7 — Resultaten opslaan (team)
- Bij PODIUM: `GameSession` + `GameResult`-rijen in de database.

### Later — L1 t/m L5
- **L1 Accounts:** registreren/inloggen (email + wachtwoord, `bcrypt`, cookie `quiz_auth` via dezelfde `cookies.js`-helper uit 6.1), accountbeheer, ingelogd joinen met accountnaam, verified-icoon.
- **L2 Beroepsrollen:** rollen kiezen op je profiel, tonen in de lobby.
- **L3 Adaptieve moeilijkheid:** zie hoofdstuk 13.
- **L4 Profiel & voortgang:** eigen statistieken per rol, geschiedenis.
- **L5 Quiz-editor:** quizzen maken/bewerken via de site (alleen voor hosts/docenten).
- **Deployment:** productie-build (client als statische bestanden via Nginx), HTTPS, echte server.

---

## 10. Docker-opzet

### 10.1 `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-quiz}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-quiz}
      POSTGRES_DB: ${POSTGRES_DB:-quizapp}
    ports:
      - "5432:5432"            # zodat je met een DB-tool kunt kijken
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  server:
    build: ./server
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-quiz}:${POSTGRES_PASSWORD:-quiz}@db:5432/${POSTGRES_DB:-quizapp}
      PORT: 3000
      NODE_ENV: development
    ports:
      - "3000:3000"
    volumes:
      - ./server:/app
      - /app/node_modules     # node_modules blijven in de container
    depends_on:
      db:
        condition: service_healthy
    command: sh -c "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run dev"

  client:
    build: ./client
    environment:
      VITE_PROXY_TARGET: http://server:3000
      VITE_PUBLIC_URL: ${PUBLIC_URL:-}   # optioneel: http://192.168.x.x:5173 voor de QR-code
      CHOKIDAR_USEPOLLING: "true"
    ports:
      - "5173:5173"
    volumes:
      - ./client:/app
      - /app/node_modules
    depends_on:
      - server

  adminer:                     # database bekijken in de browser: http://localhost:8080
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - db

volumes:
  db-data:
```

### 10.2 `server/Dockerfile`

```dockerfile
FROM node:24-alpine
RUN apk add --no-cache openssl   # nodig voor Prisma op Alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

`server/package.json` scripts: `"dev": "nodemon -L src/index.js"` (`-L` = polling, nodig voor Windows-bind-mounts), `"start": "node src/index.js"`, `"test": "vitest run"`, `"lint": "eslint ."`. Plus `"prisma": { "seed": "node prisma/seed.js" }` (of de equivalente config in de actuele Prisma-versie).

Let op: de bind-mount overschrijft `/app`, daarom draait `prisma generate` ook bij elke start (staat al in het `command` in compose).

### 10.3 `client/Dockerfile`

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### 10.4 `client/vite.config.js` (kern)

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const target = process.env.VITE_PROXY_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: { usePolling: process.env.CHOKIDAR_USEPOLLING === 'true' },
    proxy: {
      '/api': target,
      '/socket.io': { target, ws: true },
    },
  },
})
```

### 10.5 `.env.example`

```
POSTGRES_USER=quiz
POSTGRES_PASSWORD=quiz
POSTGRES_DB=quizapp
# Optioneel: je LAN-adres, zodat de QR-code werkt op telefoons in hetzelfde wifi-netwerk
PUBLIC_URL=
# Later (L1): geheime sleutel voor JWT
JWT_SECRET=verander-mij
```

### 10.6 QR-code & telefoons

- De QR-code verwijst naar `${VITE_PUBLIC_URL || window.location.origin}/join/<CODE>`.
- Opent de host de site via `localhost`, dan werkt de QR **niet** op telefoons. Open de host-pagina daarom via je LAN-IP (bijv. `http://192.168.1.23:5173`) of zet `PUBLIC_URL` in `.env`.
- Sommige wifi-netwerken (zoals schoolwifi) blokkeren verkeer tussen apparaten. Testen kan dan via een hotspot; voor echt gebruik is deployment nodig (fase "Later").

---

## 11. Inhoud van de README (Claude Code schrijft deze uit)

1. **Wat is dit project** (2–3 zinnen + link naar `docs/PROJECTPLAN.md`).
2. **Wat heb je nodig:** Docker Desktop, Git, VS Code (aanbevolen extensies: ESLint, Prettier, Docker, Prisma).
3. **Eerste keer opstarten:**
   ```bash
   git clone <repo-url>
   cd quizapp
   cp .env.example .env        # Windows PowerShell: copy .env.example .env
   docker compose up --build
   ```
   Daarna: app op http://localhost:5173, API-health op http://localhost:3000/api/health, database bekijken op http://localhost:8080 (systeem: PostgreSQL, server: `db`, gebruiker/wachtwoord: `quiz`/`quiz`, database: `quizapp`).
4. **Dagelijks gebruik:**
   - Starten: `docker compose up` · Stoppen: `Ctrl+C` of `docker compose down`
   - Logs van één service: `docker compose logs -f server`
5. **Een npm-package toevoegen:** `docker compose exec client npm install <pakket>` (of `server`). Commit `package.json` + `package-lock.json`.
6. **Na een `git pull` met nieuwe packages:** `docker compose up --build -V` (`-V` ververst de node_modules-volumes).
7. **Database:**
   - Schema gewijzigd: `docker compose exec server npx prisma migrate dev --name <wat-je-deed>` en commit de nieuwe migratiemap.
   - Seed opnieuw draaien: `docker compose exec server npx prisma db seed`
   - Alles resetten (wist alle data!): `docker compose down -v` en daarna `docker compose up --build`
8. **Tests & lint:** `docker compose exec server npm test` · `docker compose exec client npm run lint`
9. **Testen met telefoons** (hoofdstuk 10.6) en **met meerdere spelers op één laptop**: tabbladen delen cookies, dus gebruik voor elke extra speler een incognitovenster of een andere browser. Een speler "resetten": cookies wissen in DevTools (Application → Cookies).
10. **Problemen oplossen:** poort al in gebruik (5173/3000/5432/8080), Docker Desktop staat niet aan, wijzigingen worden niet herladen (polling), `prisma`-fout over de client (`docker compose exec server npx prisma generate`), regeleinden op Windows (`.gitattributes`).

---

## 12. Database-schema (Prisma)

> MVP gebruikt: `Quiz`, `Question`, `AnswerOption`, `Role`, `GameSession`, `GameResult`.
> Voor later, maar nu al aanwezig: `User`, `UserRole`, `PlayerAnswer`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------- Beroepsrollen ----------
model Role {
  id        Int        @id @default(autoincrement())
  key       String     @unique   // "ai", "frontend", "backend", "cyber", "business", "infra"
  name      String               // "AI Engineering"
  color     String?              // voor badges in de UI
  users     UserRole[]
  quizzes   Quiz[]
  questions Question[]
}

// ---------- Quizzen ----------
model Quiz {
  id          Int           @id @default(autoincrement())
  title       String
  description String?
  roleId      Int?
  role        Role?         @relation(fields: [roleId], references: [id])
  isPublished Boolean       @default(true)
  createdById Int?
  createdBy   User?         @relation(fields: [createdById], references: [id])
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  questions   Question[]
  sessions    GameSession[]
}

model Question {
  id           Int            @id @default(autoincrement())
  quizId       Int
  quiz         Quiz           @relation(fields: [quizId], references: [id], onDelete: Cascade)
  text         String
  order        Int
  timeLimitSec Int            @default(20)
  difficulty   Int            @default(1)   // 1 = makkelijk, 2 = gemiddeld, 3 = moeilijk
  roleId       Int?
  role         Role?          @relation(fields: [roleId], references: [id])
  options      AnswerOption[]
  answers      PlayerAnswer[]
}

model AnswerOption {
  id         Int            @id @default(autoincrement())
  questionId Int
  question   Question       @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text       String
  isCorrect  Boolean        @default(false)
  order      Int
  answers    PlayerAnswer[]
}

// ---------- Gespeelde games ----------
model GameSession {
  id        Int          @id @default(autoincrement())
  code      String
  quizId    Int
  quiz      Quiz         @relation(fields: [quizId], references: [id])
  round     Int          @default(1)   // telt op bij host:restart
  startedAt DateTime     @default(now())
  endedAt   DateTime?
  results   GameResult[]
}

model GameResult {
  id           Int            @id @default(autoincrement())
  sessionId    Int
  session      GameSession    @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  nickname     String
  userId       Int?
  user         User?          @relation(fields: [userId], references: [id])
  score        Int
  rank         Int
  correctCount Int
  answers      PlayerAnswer[]
}

// ---------- LATER (L1+) ----------
model User {
  id           Int          @id @default(autoincrement())
  email        String       @unique
  displayName  String       @unique
  passwordHash String
  createdAt    DateTime     @default(now())
  roles        UserRole[]
  results      GameResult[]
  quizzes      Quiz[]
}

model UserRole {
  userId Int
  roleId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@id([userId, roleId])
}

model PlayerAnswer {
  id             Int           @id @default(autoincrement())
  resultId       Int
  result         GameResult    @relation(fields: [resultId], references: [id], onDelete: Cascade)
  questionId     Int
  question       Question      @relation(fields: [questionId], references: [id])
  optionId       Int?
  option         AnswerOption? @relation(fields: [optionId], references: [id])
  isCorrect      Boolean
  responseTimeMs Int
  points         Int
}
```

**Beroepsrollen in de seed** (voorstel, aan te passen door het team): AI Engineering, Frontend, Backend, Cybersecurity, IT & Business, Infrastructuur/Cloud.

---

## 13. Spelregels & algoritmes

### 13.1 Puntentelling (`scoring.js`)

Voorstel, zoals bij Kahoot:
- Fout of geen antwoord: **0**.
- Goed: `punten = round(1000 * (1 - (responsTijd / tijdslimiet) / 2))` → tussen **500** (op de valreep) en **1000** (direct).
- (Optioneel) streak-bonus: +100 per opeenvolgend goed antwoord, max. +500.
- Gelijke score → zelfde plek (rank 1, 1, 3…).
- Responstijd wordt **op de server** gemeten vanaf het moment dat de vraag `QUESTION_ACTIVE` werd.

### 13.2 Adaptieve moeilijkheid (Later, L3)

Eerste versie = simpele, uitlegbare regels (if-statements), geen machine learning:
1. Per speler en per beroepsrol houden we een **gemiddelde score %** bij (uit `PlayerAnswer`).
2. Bij het starten of herstarten bepaalt de server een **groepsniveau**: het gemiddelde van de spelers in de lobby voor de rol van de quiz.
   - > 80 % goed → meer vragen met `difficulty` 3
   - 50–80 % → mix van 2 en 3
   - < 50 % → vooral 1 en 2
3. Bij **host:restart**: was de vorige ronde > 80 % goed, dan gaat het niveau één stap omhoog.
4. Vragen worden gekozen uit de pool van de quiz (of rol) op basis van dat niveau.
5. Alle regels komen in één bestand `server/src/game/difficulty.js`, met tests.

---

## 14. Ideeënlijst (bewaren in `docs/IDEEEN.md`)

- **Eindscherm op desktop:** scorebord in meerdere kolommen naast elkaar tonen in plaats van één lange scrollende lijst (op telefoon blijft het scrollen).
- Geluidseffecten/muziek op het host-scherm (aan/uit-knop).
- Na elke vraag op het host-scherm een staafdiagram tonen met hoeveel mensen elk antwoord kozen.
- Streak-indicator (🔥 3 op rij) bij spelers.
- Host kan een speler uit de lobby verwijderen (ongepaste naam).
- Simpel woordfilter voor ongepaste namen.
- Beroepsrollen als gekleurde badges achter de naam in de lobby, en een overzicht "In deze lobby: 4× Frontend, 2× Cyber…".
- Na de quiz: "Wie kun je om hulp vragen?" → spelers met de hoogste score per rol.
- Donker thema voor het digibord.

---

## 15. Open discussiepunten (met het team beslissen)

1. **Vraagmodus:** eerst lezen (preview) of direct antwoorden? Standaardwaarde van `questionPreviewSeconds`?
2. **Naamconflict gast ↔ account:** zit er al een gast met dezelfde naam als een account-speler, krijgt de account-speler dan een melding om in deze lobby een andere weergavenaam te kiezen? (Voorstel in hoofdstuk 5.)
3. **Beroepsrollen in de lobby:** badges per speler, een samenvattende balk, of allebei?
4. **Wie mag hosten?** In de MVP iedereen. Later alleen ingelogde docenten/hosts?
5. **Puntentelling:** formule uit 13.1 overnemen? Streak-bonus wel of niet?
6. **Max. aantal spelers** per lobby (voorstel: 100)?
7. **Vraagtypes:** alleen meerkeuze (4 opties) in de MVP? Later waar/onwaar?

---

## 16. Teamafspraken

### Git-workflow
- `main` is altijd werkend en beschermd: niemand pusht direct naar `main`.
- Per taak een branch: `feature/<korte-naam>`, `fix/<korte-naam>`, `docs/<korte-naam>`.
- Pull Request naar `main` met minimaal **1 review** van een teamgenoot. In de PR: wat je deed, hoe je het testte, en een screenshot bij UI-werk.
- Commitberichten kort en in de gebiedende wijs: `Voeg lobby-lock toe`, `Fix dubbele naam check`.
- Vóór een PR: `git pull origin main`, conflicten oplossen, lint + tests draaien.

### Code-stijl
- Prettier formatteert, ESLint controleert, dus geen discussies over spaties.
- Componenten in `PascalCase.jsx`, hooks in `useCamelCase.js`, overige bestanden in `camelCase.js`.
- Eén component per bestand. Pagina's in `pages/`, herbruikbare stukken in `components/`.
- Gebruik antd-componenten in plaats van eigen knoppen/formulieren, en pas kleuren aan via `theme.js`, niet per component.
- Event-namen **nooit** als losse string: altijd via `events.js`.
- Geen geheimen in Git: `.env` staat in `.gitignore`, alleen `.env.example` wordt gecommit.

### Taakverdeling (voorstel na de skeleton)
| Persoon | Pakket |
|---|---|
| A | Quiz-overzicht + host-instellingen (Fase 1–2 afmaken) |
| B | Lobby: lock, rejoin, offline-status (Fase 3) |
| C | Game loop + timer op de server (Fase 4) |
| D | Vraag- en antwoordschermen (host + speler) (Fase 4, frontend) |
| E | Tussenstand, podium, eindscherm/scorebord (Fase 5) |
| Iedereen | Herstart + opslaan (Fase 6–7), testen met telefoons |

---

## 17. Definition of Done — skeleton

- [ ] `docker compose up --build` werkt op een schone Windows- én macOS-laptop zonder dat er iets anders geïnstalleerd hoeft te worden dan Docker Desktop en Git.
- [ ] Hot reload werkt voor client én server.
- [ ] `/api/health` geeft database-status `ok`.
- [ ] Database wordt automatisch gemigreerd en geseed; Adminer werkt.
- [ ] Quizlijst + zoeken werkt.
- [ ] Alle pagina's bestaan als route met duidelijke `TODO(team)`-uitleg.
- [ ] Host kan een lobby aanmaken (code + QR), speler kan joinen, de naam verschijnt live, een dubbele naam wordt geweigerd.
- [ ] Rejoin werkt: browser sluiten en opnieuw openen zet speler én host terug in hun game (httpOnly-cookies, geen localStorage).
- [ ] Unit tests voor `nameRules` en `scoring` zijn groen.
- [ ] `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `docs/PROJECTPLAN.md`, `docs/SOCKET-EVENTS.md`, `docs/IDEEEN.md` bestaan.
- [ ] Alles staat op GitHub in `main`, en elk teamlid heeft het één keer zelf opgestart.
