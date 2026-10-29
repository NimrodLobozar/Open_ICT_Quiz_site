# Handleiding: tijdslimiet per vraag instellen in de lobby

Deze handleiding is geschreven voor iemand die **nog nooit** aan deze code (of aan software) heeft gewerkt. Je hoeft niets zelf te bedenken: elke stap zegt **welk bestand**, **waar** in dat bestand, en **welke code** je toevoegt. Onder elke stap staat ook **waarom**, zodat je leert hoe de app werkt.

Trek er ongeveer 2 tot 3 uur voor uit. Doe de stappen **in volgorde**.

---

## De user story

> **Als** quiz host
> **wil ik** de tijdslimiet per vraag kunnen instellen
> **zodat** ik de snelheid van de quiz kan aanpassen aan het type vragen (meerkeuze, open).

**Acceptatiecriteria**

1. In de lobby kun je kiezen uit verschillende timers per vraag, bijvoorbeeld 10 of 30 seconden.
2. Een duidelijke countdown per vraag voor alle spelers.
3. De vraag sluit automatisch af zodra de tijd op is.

**Kwaliteitscriteria**

- De timer moet vloeiend lopen zonder te haperen.

---

## 0. Wat is er al, en wat bouw jij?

Goed nieuws: een deel van deze story bestaat al.

| Criterium | Bestaat al? | Waar zit het? |
|---|---|---|
| 1. Timer kiezen in de lobby | **Nee, dit bouw jij** | — |
| 2. Countdown voor alle spelers | Ja | `src/components/TimerRing.jsx` (de ronde timer) en `src/hooks/useCountdown.js` (het aftellen) |
| 3. Vraag sluit automatisch | Ja | `backend/socket/gameLoop.js` (de server zet een wekker) |
| Vloeiende timer | Ja | `useCountdown` ververst 10× per seconde, en `TimerRing.css` animeert daartussen |

Nu heeft elke vraag een vaste tijd die in de quiz staat (meestal 20 seconden). Jij zorgt dat de host in de lobby een andere tijd kan kiezen, en dat die tijd daarna **overal** gebruikt wordt: in de countdown, bij het automatisch sluiten én bij het uitrekenen van de punten.

> **Over "open vragen":** de app kent nu alleen meerkeuzevragen. "Open" in de story is een voorbeeld van *waarom* een host meer tijd wil geven (typen duurt langer dan klikken). Een nieuw vraagtype bouwen hoort **niet** bij deze story.

### Wat de host straks ziet

```
            Ga naar 192.168.1.20:5173/join en vul in:
                         464816
                      [ 🔓 Open ]

                     Tijd per vraag
   ( Zoals in de quiz ) ( 10 sec ) ( 20 sec ) [ 30 sec ] ( 60 sec )
                                               ^^^^^^^^ gekozen = oranje

                        3 spelers
                  Emma   Daan   Sam
                    [ Quiz starten ]
```

En een speler ziet in de wachtruimte: **Tijd per vraag: 30 seconden**.

---

## 1. Een paar woorden die je moet kennen

| Woord | Betekenis in deze app |
|---|---|
| **Frontend** | Wat in de browser draait: de schermen. Staat in de map `src/`. Gemaakt met **React**. |
| **Backend / server** | Het programma dat op de server draait en de regels bewaakt. Staat in `backend/`. |
| **Host** | De docent die de quiz op het grote scherm laat zien. |
| **Lobby** | De wachtruimte vóór de quiz start. Hier kiest de host straks de tijd. |
| **Socket.IO** | Een "telefoonlijn" die open blijft tussen browser en server. Zo kan de server iets meteen naar alle spelers sturen. |
| **Event** | Een bericht over die lijn, met een naam zoals `host:lock` ("zet de lobby op slot"). |
| **Ack** | Het antwoord op een event: `{ ok: true }` of `{ ok: false, message: "..." }`. |
| **Component** | Een bouwsteen van een scherm in React, bijvoorbeeld een knop. Een functie die HTML-achtige code (JSX) teruggeeft. |
| **State** | Wat een scherm op dit moment "weet", bijvoorbeeld welke spelers er zijn. Verandert de state, dan tekent React het scherm opnieuw. |
| **Test** | Een klein stukje code dat controleert of jouw code doet wat het moet doen. Draai je met `npm test`. |

---

## 2. Voorbereiding (één keer)

### 2.1 Programma's die je nodig hebt

Installeer deze als je ze nog niet hebt:

1. **Visual Studio Code** (de code-editor): https://code.visualstudio.com
2. **Git** (versiebeheer): https://git-scm.com
3. **Node.js** versie 20 of hoger: https://nodejs.org (kies "LTS")
4. **Docker Desktop**: https://www.docker.com/products/docker-desktop. Start het na installatie en wacht tot het walvis-icoontje stilstaat.

### 2.2 Het project openen

1. Open VS Code → **File → Open Folder…** → kies de map van het project (bijv. `C:\dev\Open_ICT_Quiz_site`).
2. Open een terminal in VS Code: menu **Terminal → New Terminal**. Onderin verschijnt een venster waar je commando's typt. Alle commando's in deze handleiding typ je daar, en je drukt daarna op **Enter**.

### 2.3 Een eigen branch maken

Een *branch* is je eigen kopie van de code waarin je veilig kunt werken. We beginnen vanaf `dev` (zo is het afgesproken in dit team):

```bash
git checkout dev
git pull
git checkout -b feature_Tijdslimiet
```

> Krijg je bij `git checkout dev` een fout over "changes would be overwritten"? Dan heb je nog onbewaarde wijzigingen. Vraag een teamgenoot om hulp voordat je verdergaat.

### 2.4 De app starten

```bash
docker compose up -d --build
npm install
```

- `docker compose up` start de database, de server en de website. De eerste keer duurt dit een paar minuten.
- `npm install` downloadt de hulpprogramma's die nodig zijn om de tests op je eigen laptop te draaien.

Controleer of alles werkt:

```bash
npm test
```

Onderaan moet staan: **Tests ... passed** en geen `failed`. Staat er wel `failed`? Stop dan en vraag hulp: dan was er al iets kapot vóór jouw werk.

Open daarna http://localhost:5173 in je browser. Je ziet de startpagina van de quiz.

### 2.5 Hoe je een bestand vindt en een regel zoekt

- **Bestand openen:** druk `Ctrl+P`, typ de naam (bijv. `Game.js`) en druk Enter.
- **Iets zoeken in een bestand:** druk `Ctrl+F` en typ een stukje van de regel die in deze handleiding staat.
- **Naar een regelnummer:** druk `Ctrl+G` en typ het nummer. De regelnummers in deze handleiding kloppen voor de code zoals hij nu is; zodra je zelf regels toevoegt, schuift alles eronder op. Zoek daarom liever met `Ctrl+F`.
- **Opslaan:** `Ctrl+S`. Vergeet dit niet na elke stap!

> **Let op met inspringen (spaties vooraan):** JavaScript werkt ook met verkeerde inspringing, maar het team leest het slecht. Neem de spaties over zoals ze in de voorbeelden staan.

---

## 3. Het plan in één plaatje

Zo reist de keuze van de host door de app:

```
 HOST-SCHERM (browser)                 SERVER                              ALLE SPELERS
 ─────────────────────                 ──────                              ────────────
 klikt "30 sec"
   │  event host:set-time-limit
   │  { seconds: 30 }
   └──────────────────────────▶  hostHandlers.js
                                   game.setTimeLimit(30)   ← Game.js controleert:
                                   │                          - zitten we in de lobby?
                                   │                          - is 30 een toegestane keuze?
                                   │  event lobby:update
                                   │  { ..., timeLimitSec: 30 }
   ◀───────────────────────────────┴──────────────────────────────────▶  "Tijd per vraag: 30 seconden"
 knop "30 sec" wordt oranje

 ... host klikt "Quiz starten" ...

                                   Game.js gebruikt nu 30 s voor:
                                   - question:show  → countdown op elk scherm (criterium 2)
                                   - de wekker in gameLoop.js → vraag sluit vanzelf (criterium 3)
                                   - de punten (sneller = meer punten, binnen 30 s)
```

**Belangrijk idee:** de **server** beslist en onthoudt de tijd, niet de browser. Een browser kun je met DevTools veranderen; de server niet. Daarom controleert de server ook of de gekozen tijd geldig is.

### Welke bestanden je aanraakt

| # | Bestand | Wat |
|---|---|---|
| 1 | `backend/game/Game.js` | De tijd onthouden, controleren en gebruiken |
| 2 | `backend/tests/Game.test.js` | Tests voor stap 1 |
| 3 | `backend/socket/events.js` | Naam van het nieuwe event |
| 4 | `src/socket/events.js` | Dezelfde naam voor de frontend (kopie) |
| 5 | `backend/socket/hostHandlers.js` | Het event van de host ontvangen |
| 6 | `backend/socket/broadcast.js` | De tijd meesturen in `lobby:update` |
| 7 | `backend/socket/syncState.js` | De tijd meesturen na verversen |
| 8 | `src/components/TimeLimitPicker.jsx` | **Nieuw:** de keuzeknoppen |
| 9 | `src/components/TimeLimitPicker.css` | **Nieuw:** opmaak van de knoppen |
| 10 | `src/pages/HostGamePage/HostGamePage.jsx` | De knoppen in de lobby van de host zetten |
| 11 | `src/pages/PlayerGamePage/PlayerGamePage.jsx` | Spelers laten zien welke tijd er gekozen is |
| 12 | `docs/SOCKET-EVENTS.md` | Documentatie van het nieuwe event |

We beginnen bij de server (de regels), dan de verbinding, en als laatste de schermen.

---

## Stap 1: De server laten onthouden welke tijd de host kiest

**Bestand:** `backend/game/Game.js`

Dit bestand beschrijft één lopende quiz: welke spelers er zijn, in welke fase de quiz is, welke vraag er loopt. Het weet niets van internet of browsers; het houdt alleen de toestand bij. Daardoor kun je het makkelijk testen.

Deze stap heeft **6 kleine onderdelen** (1a t/m 1f).

### 1a. De lijst met toegestane tijden importeren

De toegestane tijden (10, 20, 30, 60) staan al in `backend/quiz/quizRules.js` als `TIME_OPTIONS`. Die lijst wordt ook gebruikt in de quiz-editor. We hergebruiken hem, zodat er maar **één** lijst is.

Zoek bovenaan (rond **regel 7**):

```js
import { QUIZ_QUESTIONS } from "./quizQuestions.js";
```

Zet **direct daaronder** deze nieuwe regel:

```js
import { TIME_OPTIONS } from "../quiz/quizRules.js";
```

**Waarom `../quiz/`?** `..` betekent "één map omhoog". Vanuit `backend/game/` ga je naar `backend/`, en dan naar `quiz/quizRules.js`.

### 1b. Een plek maken om de keuze te bewaren

Zoek in de `constructor` (rond **regel 37**):

```js
    this.previewSeconds = previewSeconds;
```

Zet **direct daaronder**:

```js
    // Tijd per vraag die de host in de lobby kiest (in seconden).
    // null = de host koos niets: dan geldt de tijd die bij elke vraag in de quiz staat.
    this.timeLimitSec = null;
```

**Waarom `null`?** `null` betekent in JavaScript "er is (nog) niets". Kiest de host niets, dan verandert er niets aan de quiz: elke vraag houdt zijn eigen tijd uit de quiz-editor.

### 1c. Een functie om de tijd te kiezen (met controles)

Zoek de functie `setLocked`. Die eindigt zo (rond **regel 133**):

```js
    this.locked = Boolean(locked);
  }
```

Zet **direct na die sluitende `}`** (dus na de hele functie `setLocked`) een lege regel en dan deze nieuwe functie:

```js

  /**
   * De host kiest in de lobby de tijd per vraag (bijv. 10 seconden voor snelle vragen).
   * null = terug naar de tijden uit de quiz. Na de start mag het niet meer:
   * dan zouden spelers midden in de quiz ineens minder tijd krijgen.
   */
  setTimeLimit(seconds) {
    if (this.phase !== PHASES.LOBBY) {
      throw new GameError(
        "WRONG_PHASE",
        "De tijd per vraag kan alleen in de lobby worden gekozen.",
        409,
      );
    }
    // Nooit blind overnemen wat een browser stuurt: alleen de vaste keuzes (of null) zijn goed.
    if (seconds !== null && !TIME_OPTIONS.includes(seconds)) {
      throw new GameError(
        "INVALID_TIME_LIMIT",
        "Kies een geldige tijd per vraag.",
        400,
      );
    }
    this.timeLimitSec = seconds;
  }
```

**Wat gebeurt hier, regel voor regel?**

- `if (this.phase !== PHASES.LOBBY)`: "als we **niet** in de lobby zijn…". `!==` betekent "is niet gelijk aan".
- `throw new GameError(...)`: stop en geef een fout terug. De drie waarden zijn: een **code** voor programmeurs, een **Nederlandse melding** voor de host, en een **HTTP-statuscode** (409 = "kan nu niet", 400 = "foute invoer"). Zo werken alle andere functies in dit bestand ook (kijk maar naar `setLocked` erboven).
- `TIME_OPTIONS.includes(seconds)`: staat dit getal in de lijst `[10, 20, 30, 60]`? Let op: `includes` vergelijkt precies, dus de tekst `"30"` (met aanhalingstekens) wordt **geweigerd**, alleen het getal `30` mag.
- `this.timeLimitSec = seconds;`: alles klopt, dus bewaren.

### 1d. Eén plek die zegt hoe lang de huidige vraag duurt

Zoek (rond **regel 150**):

```js
  /** Moment (ms) waarop de tijd voor de huidige vraag op is. */
  get endsAt() {
    return this.startsAt + this.currentQuestion.timeLimitSec * 1000;
  }
```

**Vervang die 4 regels** door:

```js
  /** Hoeveel seconden de huidige vraag duurt: de keuze van de host, anders de tijd uit de quiz. */
  get currentTimeLimitSec() {
    return this.timeLimitSec ?? this.currentQuestion.timeLimitSec;
  }

  /** Moment (ms) waarop de tijd voor de huidige vraag op is. */
  get endsAt() {
    return this.startsAt + this.currentTimeLimitSec * 1000;
  }
```

**Uitleg:**

- `get` maakt een *getter*: je gebruikt hem als een gewone waarde (`game.currentTimeLimitSec`), maar hij wordt elke keer opnieuw uitgerekend.
- `??` betekent "als links `null` is, neem dan rechts". Dus: keuze van de host, en anders de tijd van de vraag zelf.
- `* 1000`: de server rekent in **milliseconden** (1 seconde = 1000 ms).
- **Dit is het hart van criterium 3.** `endsAt` is het moment waarop de vraag sluit. `backend/socket/gameLoop.js` zet een wekker op precies `game.endsAt` en sluit dan de vraag. Omdat `endsAt` nu de keuze van de host gebruikt, sluit de vraag automatisch na 10, 20, 30 of 60 seconden. In `gameLoop.js` hoef je dus **niets** te veranderen.

### 1e. De gekozen tijd gebruiken bij het uitrekenen van de punten

Snel antwoorden levert meer punten op. Hoe snel "snel" is, hangt af van de tijdslimiet. Die moet dus ook de nieuwe tijd gebruiken.

Zoek in de functie `endQuestion` (rond **regel 275**, 8 spaties ingesprongen):

```js
        timeLimitSec: question.timeLimitSec,
```

Vervang die regel door:

```js
        timeLimitSec: this.currentTimeLimitSec,
```

### 1f. De gekozen tijd naar alle schermen sturen

Zoek in de functie `getQuestionPayload` (rond **regel 329**, 6 spaties ingesprongen):

```js
      timeLimitSec: question.timeLimitSec,
      previewSeconds: this.previewSeconds,
```

Vervang de **eerste** van die twee regels, zodat er staat:

```js
      timeLimitSec: this.currentTimeLimitSec,
      previewSeconds: this.previewSeconds,
```

**Waarom?** `getQuestionPayload` maakt het bericht `question:show` dat naar **alle** schermen gaat (host én spelers). Hun timer-ring tekent `timeLimitSec`. Zo zien alle spelers dezelfde countdown met de gekozen tijd (**criterium 2**).

> **Controle:** zoek met `Ctrl+F` naar `question.timeLimitSec` in `Game.js`. Je mag **geen** resultaten meer vinden. Vind je er nog één, dan heb je 1e of 1f overgeslagen.

Sla op (`Ctrl+S`).

> **Wat gebeurt er bij "Opnieuw spelen"?** De functie `restart()` zet de gekozen tijd niet terug. Dat is bewust: de host speelt meestal opnieuw in hetzelfde tempo, en kan in de lobby altijd een andere tijd kiezen.

---

## Stap 2: Tests schrijven voor stap 1

**Bestand:** `backend/tests/Game.test.js`

Een test is code die jouw code uitprobeert. Zo weet je zeker dat het werkt, ook als iemand er later iets aan verandert.

Zoek (rond **regel 134**):

```js
  it('laat de tijd nu beginnen als de host de leestijd overslaat', () => {
```

Zet **direct erboven** (dus vóór die regel) deze drie tests:

```js
  it('gebruikt zonder keuze van de host de tijd uit de quiz', () => {
    game.start(T0)
    expect(game.getQuestionPayload(T0).timeLimitSec).toBe(QUIZ_QUESTIONS[0].timeLimitSec)
  })

  it('gebruikt de tijd per vraag die de host in de lobby koos', () => {
    game.setTimeLimit(10)
    game.start(T0)
    game.openAnswers(T0 + 5000)

    // Iedereen krijgt de nieuwe tijd mee, en de server stopt de vraag na 10 seconden.
    expect(game.getQuestionPayload(T0 + 5000).timeLimitSec).toBe(10)
    expect(game.endsAt).toBe(T0 + 5000 + 10_000)
    expect(() => game.submitAnswer(emma.id, { questionIndex: 0, optionId: CORRECT }, T0 + 5000 + 11_000)).toThrow(
      expect.objectContaining({ code: 'TOO_LATE' }),
    )
  })

  it('weigert een ongeldige tijd, en een nieuwe tijd na de start', () => {
    expect(() => game.setTimeLimit(7)).toThrow(expect.objectContaining({ code: 'INVALID_TIME_LIMIT' }))
    expect(() => game.setTimeLimit('30')).toThrow(expect.objectContaining({ code: 'INVALID_TIME_LIMIT' }))

    game.setTimeLimit(30)
    game.setTimeLimit(null) // terug naar de tijden uit de quiz
    expect(game.timeLimitSec).toBeNull()

    game.start(T0)
    expect(() => game.setTimeLimit(30)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }))
  })

```

**Hoe lees je een test?**

- `it('...', () => { ... })`: één test, met een zin die zegt wat er moet kloppen.
- `expect(x).toBe(y)`: "ik verwacht dat x gelijk is aan y". Is dat niet zo, dan faalt de test.
- `expect(() => ...).toThrow(...)`: "ik verwacht dat dit een fout geeft".
- `T0`, `game`, `emma` en `CORRECT` bestaan al: ze staan bovenaan dit `describe`-blok (rond regel 80–94). `T0` is een vast nep-"nu", zodat de test niet echt hoeft te wachten.
- In de tweede test antwoordt Emma na 11 seconden terwijl de tijd 10 seconden is. De server geeft nog een halve seconde extra (voor trage wifi), maar 11 is te laat, dus `TOO_LATE`.

Sla op en draai de tests:

```bash
npm test
```

Je moet zien: alles **passed**, en 3 tests meer dan bij stap 2.4. Wil je alleen dit bestand testen:

```bash
npx vitest run backend/tests/Game.test.js
```

> **Rood?** Lees de foutmelding: er staat welke test faalt en wat er verwacht werd (`Expected`) tegenover wat er kwam (`Received`). Vergelijk je code in stap 1 nog eens precies met deze handleiding.

---

## Stap 3: De naam van het nieuwe event vastleggen

Alle eventnamen staan in één lijst. Waarom? Een typfout in een tekst (`'host:set-time-limt'`) geeft geen foutmelding; het bericht komt dan gewoon nooit aan. Met een vaste naam (`EVENTS.HOST_SET_TIME_LIMIT`) zie je een typfout wel meteen.

### 3a. Backend

**Bestand:** `backend/socket/events.js`

Zoek (rond **regel 14**):

```js
  HOST_LOCK: "host:lock", // alleen in de lobby: { locked } = nieuwe spelers weigeren of weer toelaten
```

Zet **direct daaronder**:

```js
  HOST_SET_TIME_LIMIT: "host:set-time-limit", // alleen in de lobby: { seconds } = tijd per vraag (null = uit de quiz)
```

### 3b. Frontend (de kopie)

**Bestand:** `src/socket/events.js`

De frontend heeft een **kopie** van dezelfde lijst. Die moet altijd gelijk blijven aan de backend.

Zoek (rond **regel 11**):

```js
  HOST_LOCK: "host:lock", // alleen in de lobby
```

Zet **direct daaronder**:

```js
  HOST_SET_TIME_LIMIT: "host:set-time-limit", // alleen in de lobby
```

Sla beide bestanden op.

---

## Stap 4: De server laten luisteren naar de keuze van de host

**Bestand:** `backend/socket/hostHandlers.js`

Hier staan alle berichten die **alleen de host** mag sturen. Een speler kan dit event dus niet misbruiken: de server luistert er bij spelers niet eens naar.

Zoek het einde van het blok voor `HOST_LOCK` (rond **regel 100–108**). Het ziet er zo uit:

```js
  socket.on(EVENTS.HOST_LOCK, ({ locked } = {}, ack) => {
    try {
      game.setLocked(locked);
      sendLobbyUpdate(io, game);
      ack?.({ ok: true, locked: game.locked });
    } catch (error) {
      ack?.(toErrorResponse(error));
    }
  });
```

Zet **direct na die laatste regel `});`** een lege regel en dan:

```js

  // Tijd per vraag kiezen in de lobby. Game.setTimeLimit controleert of het mag;
  // lobby:update vertelt daarna iedereen (host én spelers) de nieuwe tijd.
  socket.on(EVENTS.HOST_SET_TIME_LIMIT, ({ seconds = null } = {}, ack) => {
    try {
      game.setTimeLimit(seconds);
      sendLobbyUpdate(io, game);
      ack?.({ ok: true, timeLimitSec: game.timeLimitSec });
    } catch (error) {
      ack?.(toErrorResponse(error));
    }
  });
```

> Let op: dit moet **binnen** de functie `registerHostHandlers` staan, dus vóór de `}` die die functie afsluit (en vóór de functie `toErrorResponse`).

**Uitleg:**

- `socket.on(naam, (payload, ack) => {...})`: "als dit bericht binnenkomt, doe dan dit".
- `({ seconds = null } = {})`: haal `seconds` uit het bericht. Stuurt de browser niets mee, dan wordt het `null`.
- `try { ... } catch (error) { ... }`: probeer het; gaat het mis (bijv. `setTimeLimit` gooit `INVALID_TIME_LIMIT`), dan sturen we de fout netjes terug in plaats van dat de server crasht.
- `sendLobbyUpdate(io, game)`: stuur de nieuwe lobby-stand naar **iedereen** in deze quiz.
- `ack?.(...)`: stuur een antwoord terug naar de host. Het `?.` betekent "alleen als er een ack-functie is".

Je hoeft niets te importeren: `EVENTS`, `sendLobbyUpdate` en `toErrorResponse` staan al bovenaan/onderaan dit bestand.

Sla op.

---

## Stap 5: De gekozen tijd meesturen naar alle schermen

### 5a. Bij elke lobby-update

**Bestand:** `backend/socket/broadcast.js`

Zoek in de functie `sendLobbyUpdate` (rond **regel 13**):

```js
    locked: game.locked,
  })
```

Maak ervan:

```js
    locked: game.locked,
    timeLimitSec: game.timeLimitSec,
  })
```

### 5b. Na verversen van de pagina

**Bestand:** `backend/socket/syncState.js`

Als iemand de pagina ververst, heeft die browser de live-berichten gemist. Daarom vraagt de browser na elke (her)verbinding de hele toestand op (`game:sync`). Die moet dezelfde lobby-gegevens bevatten als `lobby:update`, anders is de gekozen tijd na verversen "weg".

Zoek (rond **regel 16**):

```js
    lobby: { players, playerCount: players.length, locked: game.locked },
```

Vervang door:

```js
    lobby: { players, playerCount: players.length, locked: game.locked, timeLimitSec: game.timeLimitSec },
```

Sla beide bestanden op.

**De server is nu klaar.** Docker herstart de server vanzelf als je een bestand opslaat (dat doet het programma *nodemon*). Draai voor de zekerheid nog eens `npm test`: alles moet groen zijn.

---

## Stap 6: De keuzeknoppen maken (nieuw component)

Nu de schermen. We maken eerst een losse bouwsteen: een rij knoppen. Zo blijft de (al lange) lobby-pagina overzichtelijk.

### 6a. Het component

**Nieuw bestand:** `src/components/TimeLimitPicker.jsx`

Zo maak je een nieuw bestand in VS Code: klik links in de verkenner met de **rechtermuisknop** op de map `src/components` → **New File…** → typ `TimeLimitPicker.jsx` → Enter. Plak dan deze code erin:

```jsx
import "./TimeLimitPicker.css";

// De keuzes voor de host. null = de tijden die al bij de vragen in de quiz staan.
// Dezelfde getallen als TIME_OPTIONS in backend/quiz/quizRules.js: andere waarden weigert de server.
const CHOICES = [
  { seconds: null, label: "Zoals in de quiz" },
  { seconds: 10, label: "10 sec" },
  { seconds: 20, label: "20 sec" },
  { seconds: 30, label: "30 sec" },
  { seconds: 60, label: "60 sec" },
];

/**
 * Knoppen om in de lobby de tijd per vraag te kiezen.
 * Net als LockButton onthoudt dit onderdeel zelf niets: `value` komt van de server (lobby:update),
 * zodat de knoppen na verversen of in een tweede tabblad hetzelfde laten zien als de server.
 * @param {{ value: number | null, onChange: (seconds: number | null) => void, disabled?: boolean }} props
 */
export default function TimeLimitPicker({ value, onChange, disabled = false }) {
  return (
    <div
      className="time-picker"
      role="group"
      aria-labelledby="time-picker-label"
    >
      <p id="time-picker-label" className="time-picker__label">
        Tijd per vraag
      </p>
      <div className="time-picker__choices">
        {CHOICES.map((choice) => {
          const selected = choice.seconds === value;
          return (
            <button
              key={choice.label}
              type="button"
              className={
                selected
                  ? "time-picker__choice time-picker__choice--selected"
                  : "time-picker__choice"
              }
              // aria-pressed vertelt een schermlezer welke knop nu "aan" staat.
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(choice.seconds)}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Uitleg:**

- `CHOICES` is een lijst met 5 keuzes. Wil het team later bijv. 45 seconden toevoegen, dan moet dat **hier én** in `TIME_OPTIONS` in `backend/quiz/quizRules.js`.
- Een component krijgt **props** (invoer) mee: `value` (welke tijd nu gekozen is), `onChange` (wat er moet gebeuren bij een klik) en `disabled` (knoppen even uitzetten).
- `CHOICES.map(...)` maakt voor elke keuze een `<button>`. React wil bij zo'n lijst een unieke `key` per item.
- `selected ? "a" : "b"`: als `selected` waar is, gebruik `"a"`, anders `"b"`. Zo krijgt de gekozen knop een extra CSS-klasse en wordt hij oranje.
- `role="group"` en `aria-pressed` zijn voor toegankelijkheid: een schermlezer zegt dan "Tijd per vraag, 30 sec, ingedrukt".

### 6b. De opmaak

**Nieuw bestand:** `src/components/TimeLimitPicker.css` (op dezelfde manier aanmaken):

```css
/* Keuzeknoppen "Tijd per vraag" in de lobby van de host. Kleuren komen uit src/index.css (--quiz-*). */
.time-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.time-picker__label {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.time-picker__choices {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.time-picker__choice {
  min-height: 44px; /* groot genoeg om goed op te klikken, ook op een touchscreen */
  padding: 0 18px;
  border: 2px solid var(--quiz-border);
  border-radius: 999px;
  background: var(--quiz-surface);
  color: var(--quiz-text);
  font: inherit;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.time-picker__choice:hover:not(:disabled) {
  border-color: var(--quiz-primary);
}

.time-picker__choice:focus-visible {
  outline: 3px solid var(--quiz-text);
  outline-offset: 3px;
}

/* De gekozen tijd: gevuld met de hoofdkleur, zodat je in één oogopslag ziet wat er aan staat. */
.time-picker__choice--selected {
  border-color: var(--quiz-primary);
  background: var(--quiz-primary);
  color: #ffffff;
}

.time-picker__choice:disabled {
  cursor: wait;
  opacity: 0.7;
}
```

**Waarom `var(--quiz-primary)` en geen kleurcode als `#f97316`?** Afspraak in dit project: alle kleuren staan één keer in `src/index.css`. Verandert het team de huiskleur, dan verandert jouw knop automatisch mee.

Sla beide bestanden op.

---

## Stap 7: De knoppen in de lobby van de host zetten

**Bestand:** `src/pages/HostGamePage/HostGamePage.jsx`

Dit is het grote scherm van de host. Deze stap heeft **4 onderdelen**.

### 7a. Het component importeren

Zoek bovenaan (rond **regel 5**):

```jsx
import QuizHeader from "../../components/QuizHeader.jsx";
```

Zet **direct daaronder**:

```jsx
import TimeLimitPicker from "../../components/TimeLimitPicker.jsx";
```

### 7b. Een functie die de keuze naar de server stuurt

Zoek (rond **regel 156**):

```jsx
  // Eén actie voor "Antwoorden nu tonen", "Tijd stoppen" en "Volgende vraag" (zie Game.next op de server).
```

Zet **direct erboven** (dus tussen de functie `toggleLock` en dit commentaar):

```jsx
  // Tijd per vraag kiezen. Net als bij het slot wachten we op lobby:update:
  // zo laat het scherm altijd de tijd zien die de server echt gebruikt.
  async function changeTimeLimit(seconds) {
    setBusy(true);
    setError(null);
    const response = await emitWithAck(EVENTS.HOST_SET_TIME_LIMIT, {
      seconds,
    }).catch(() => null);
    if (!response?.ok)
      setError(response?.message ?? "Geen antwoord van de server.");
    setBusy(false);
  }

```

**Uitleg:**

- Deze functie lijkt bewust bijna precies op `toggleLock` erboven. Vergelijk ze maar: zo werkt elke host-actie in deze app.
- `setBusy(true)`: zet de knoppen even uit, zodat de host niet vijf keer snel kan klikken.
- `emitWithAck(...)`: stuur het event naar de server en **wacht** (`await`) op het antwoord.
- `.catch(() => null)`: valt de verbinding weg, dan krijgen we `null` in plaats van een crash.
- Ging het mis? Dan tonen we de melding van de server (bijv. "Kies een geldige tijd per vraag.").
- We veranderen de knop hier **niet** zelf naar oranje. Dat gebeurt pas als de server `lobby:update` stuurt (de pagina luistert daar al naar, rond regel 101). Zo kan het scherm nooit iets anders laten zien dan wat de server echt gebruikt.

### 7c. De gekozen tijd uit de lobby-gegevens halen

Zoek (rond **regel 272**, na stap 7b een stuk lager):

```jsx
  const { players, playerCount, locked } = game.lobby;
```

Vervang door:

```jsx
  const { players, playerCount, locked, timeLimitSec } = game.lobby;
```

Dit haalt `timeLimitSec` uit `game.lobby` (dat de server in stap 5 meestuurt) in een eigen variabele.

### 7d. De knoppen op het scherm zetten

Zoek (rond **regel 294**):

```jsx
        <LockButton locked={locked} onToggle={toggleLock} disabled={busy} />
```

Zet **direct daaronder**:

```jsx
        <TimeLimitPicker
          value={timeLimitSec ?? null}
          onChange={changeTimeLimit}
          disabled={busy}
        />
```

`?? null` zorgt dat het altijd `null` is als er niets gekozen is (en niet `undefined`), zodat de knop "Zoals in de quiz" dan oranje is.

Sla op.

---

## Stap 8: Spelers laten zien welke tijd er gekozen is

**Bestand:** `src/pages/PlayerGamePage/PlayerGamePage.jsx`

Dit is het scherm van de speler (laptop of telefoon). In de wachtruimte laten we zien hoeveel tijd ze per vraag krijgen. Dat is fijn om te weten, en zo ziet de host ook dat zijn keuze bij iedereen aankomt.

Zoek (rond **regel 247–250**):

```jsx
        <p>
          {game.lobby.playerCount}{" "}
          {game.lobby.playerCount === 1 ? "speler" : "spelers"} in de lobby
        </p>
```

Zet **direct na die `</p>`**:

```jsx
        <p>
          Tijd per vraag:{" "}
          <strong>
            {game.lobby.timeLimitSec
              ? `${game.lobby.timeLimitSec} seconden`
              : "zoals in de quiz"}
          </strong>
        </p>
```

**Uitleg:**

- `{" "}` is een spatie. In JSX verdwijnen spaties aan het eind van een regel, dus zo zet je er één neer.
- `` `${...} seconden` `` (met **backticks**, het schuine aanhalingsteken links van de 1 op je toetsenbord) is een *template string*: hij zet het getal in de tekst, bijv. "30 seconden".
- Is `timeLimitSec` `null`, dan staat er "zoals in de quiz".

Sla op. De speler-pagina luistert al naar `lobby:update` en `game:sync`, dus de tekst verandert vanzelf als de host een andere tijd kiest.

---

## Stap 9: De documentatie bijwerken

**Bestand:** `docs/SOCKET-EVENTS.md`

Afspraak in dit team: verander je een event, dan pas je ook dit document aan, in dezelfde PR.

### 9a. Het nieuwe event in de tabel "Client → server"

Zoek de regel die begint met `` | `host:lock` | host | ``. Zet **daaronder** een nieuwe regel:

```md
| `host:set-time-limit` | host | `{ seconds: 10 \| 20 \| 30 \| 60 \| null }` | `{ ok, timeLimitSec }`; alleen in `LOBBY`, anders `WRONG_PHASE`. Andere waarden: `INVALID_TIME_LIMIT`. `null` = de tijd per vraag uit de quiz. Geldt voor alle vragen (countdown, automatisch sluiten en punten). Iedereen krijgt `lobby:update` met de nieuwe `timeLimitSec` |
```

(`\|` is een `|` die niet als kolomscheiding telt.)

### 9b. `lobby:update` en `game:sync`

Zoek in de tabel "Server → client" de regel van `lobby:update` en verander het einde:

```md
`{ players: [...], playerCount, locked }`
```

in:

```md
`{ players: [...], playerCount, locked, timeLimitSec }`
```

Doe hetzelfde in het blok `### state van game:sync`, bij de regel die begint met `lobby:`:

```js
  lobby: { players: [{ id, nickname, connected, isVerified }], playerCount, locked, timeLimitSec },
```

Zoek tot slot de zin `antwoordtijd: \`timeLimitSec\` van de vraag (20)` en maak ervan: ``antwoordtijd: de tijd die de host in de lobby koos (`host:set-time-limit`), anders `timeLimitSec` van de vraag (20)``.

Sla op.

---

## 10. Testen

### 10.1 Automatische tests

```bash
npm test
```

Alles moet **passed** zijn. Heb je Docker draaien, doe dan ook deze twee (ze testen de hele app, inclusief database en een volledige quiz):

```bash
npm run test:api
npm run test:smoke
```

### 10.2 Zelf uitproberen in de browser

Je hebt **twee spelers** nodig om te kunnen starten. Gebruik daarvoor twee andere browservensters, bijvoorbeeld een **incognitovenster** (`Ctrl+Shift+N` in Chrome) en een andere browser (Edge of Firefox). Elk venster is dan een andere speler.

1. **Host:** ga naar http://localhost:5173/inloggen en log in als docent: `docent@hu.nl` / `Docent123`.
2. Ga naar het beheerportaal, kies een quiz die op **Klaar** staat en klik op **Hosten**. Je ziet de lobby met de code.
3. **Controleer:** onder de slot-knop staat **Tijd per vraag** met 5 knoppen; **Zoals in de quiz** is oranje.
4. **Speler 1:** in het incognitovenster: ga naar http://localhost:5173/join, vul de code in en een naam (bijv. `Test1`).
5. **Speler 2:** in de andere browser hetzelfde met naam `Test2`.
6. **Controleer bij de spelers:** "Tijd per vraag: **zoals in de quiz**".
7. **Host:** klik **10 sec**.
   - De knop **10 sec** wordt oranje. ✅ *criterium 1*
   - Bij beide spelers staat nu meteen "Tijd per vraag: **10 seconden**" (zonder verversen).
8. Druk bij de host op **F5** (verversen). De knop **10 sec** moet nog steeds oranje zijn. (Werkt dit niet? Dan mist stap 5b.)
9. **Host:** klik **Quiz starten**. Na 5 seconden leestijd verschijnen de antwoorden.
   - Host en beide spelers zien de ring aftellen vanaf **10**. ✅ *criterium 2*
10. **Antwoord niet** en wacht. Na 10 seconden sluit de vraag vanzelf en verschijnt de uitslag. ✅ *criterium 3*
11. Speel nog een vraag waarbij beide spelers wél antwoorden: de vraag sluit dan meteen (dat bestond al: als iedereen geantwoord heeft, hoeft niemand te wachten).

### 10.3 Controleren dat de server foute invoer weigert

De knoppen sturen alleen goede waarden, maar iemand kan ook zelf berichten sturen. Probeer dat:

1. Maak een nieuwe lobby (host) en open bij de host **DevTools** met `F12` → tabblad **Console**.
2. Plak dit en druk Enter:

   ```js
   const { socket } = await import('/src/socket/socket.js');
   socket.emit('host:set-time-limit', { seconds: 7 }, console.log);
   ```

3. Je moet zien: `{ ok: false, error: 'INVALID_TIME_LIMIT', message: 'Kies een geldige tijd per vraag.' }`.
4. Start de quiz en probeer het opnieuw met `{ seconds: 30 }`. Nu moet je `WRONG_PHASE` zien: na de start mag het niet meer.

### 10.4 Kwaliteitscriterium: loopt de timer vloeiend?

Hiervoor hoef je niets te bouwen; het bestaat al. Wel goed om te begrijpen **waarom** het vloeiend is, en om het te controleren:

- **De server stuurt een tijdstip, geen seconden.** In `question:show` staat `startsAt` ("de antwoorden openen op tijdstip X") en `timeLimitSec`. Elk scherm rekent zelf uit hoeveel tijd er nog over is. Komt een bericht een halve seconde later binnen, dan telt dat scherm toch naar hetzelfde eindmoment af. Er hoeft dus niet elke seconde een bericht over het netwerk (dat zou haperen bij trage wifi).
- **Klokverschil wordt rechtgezet.** De klok van een laptop kan seconden afwijken. `src/socket/serverTime.js` (`withLocalStartsAt`) rekent het tijdstip van de server om naar de klok van de browser.
- **10× per seconde verversen.** `src/hooks/useCountdown.js` ververst elke 100 ms, en niet 1× per seconde.
- **Animatie tussen de tikken.** In `src/components/TimerRing.css` staat `transition: stroke-dashoffset 0.1s linear`: de browser schuift de ring in precies die 0,1 s soepel door naar de volgende stand. Daardoor zie je geen schokjes.

**Controleren:**

1. Kijk tijdens een vraag naar de ring op het grote scherm én op een telefoon: hij moet gelijkmatig leeglopen, zonder sprongen.
2. Kies 60 seconden: ook bij een lange tijd loopt de ring rustig en gelijkmatig.
3. Zwaardere test: DevTools (`F12`) → tabblad **Performance** → tandwiel → **CPU: 4× slowdown**. De ring moet nog steeds soepel lopen en op hetzelfde moment op 0 staan als op de andere schermen.

---

## 11. Je werk opslaan en delen (commit en pull request)

Kijk eerst wat je veranderd hebt:

```bash
git status
```

Je moet de 10 gewijzigde bestanden en 2 nieuwe bestanden (`TimeLimitPicker.jsx`, `TimeLimitPicker.css`) zien.

Voeg alles toe en maak een commit. In dit team gebruiken commit-berichten het formaat `feat:` (nieuwe functie), `fix:` (reparatie), enzovoort:

```bash
git add backend src docs
git commit -m "feat: host kiest de tijd per vraag in de lobby"
git push -u origin feature_Tijdslimiet
```

Open daarna GitHub. Je ziet een gele balk met **Compare & pull request**. Klik erop en let op:

- **base:** `dev` (niet `main`!)
- **compare:** `feature_Tijdslimiet`
- Zet in de beschrijving de user story en hoe je getest hebt (stap 10).

---

## 12. Problemen oplossen

| Wat zie je? | Waarschijnlijke oorzaak | Oplossing |
|---|---|---|
| `npm test`: `TIME_OPTIONS is not defined` | Stap 1a vergeten | Voeg de import bovenaan `Game.js` toe |
| `npm test`: `game.setTimeLimit is not a function` | Stap 1c staat niet in de klasse `Game`, of is niet opgeslagen | Controleer dat de functie tussen `setLocked` en `setConnected` staat; `Ctrl+S` |
| De knoppen verschijnen niet | Stap 7a of 7d vergeten, of bestand niet opgeslagen | Controleer de import en de `<TimeLimitPicker ... />` |
| Witte pagina, in de console: `Failed to resolve import "./TimeLimitPicker.css"` | De CSS-naam is anders gespeld | De bestandsnaam moet precies `TimeLimitPicker.css` zijn (hoofdletters tellen mee) |
| Je klikt, maar de knop wordt niet oranje en er komt geen melding | Stap 3b vergeten (de frontend kent het event niet) of stap 4 ontbreekt | Controleer beide `events.js`-bestanden en `hostHandlers.js`. Kijk ook in `docker compose logs backend` |
| Melding "Geen antwoord van de server." | De server draait niet of is gecrasht | `docker compose logs backend` laat de fout zien. Vaak een typfout (vergeten `}` of `,`) |
| Knop wordt oranje, maar na F5 weer "Zoals in de quiz" | Stap 5b vergeten | Voeg `timeLimitSec` toe in `syncState.js` |
| Spelers zien "zoals in de quiz" terwijl de host 10 sec koos | Stap 5a vergeten | Voeg `timeLimitSec` toe in `broadcast.js` |
| De ring telt af vanaf 20 terwijl je 10 koos | Stap 1f vergeten | `getQuestionPayload` moet `this.currentTimeLimitSec` gebruiken |
| De ring staat op 0 maar de vraag sluit pas later (of eerder) | Stap 1d vergeten | `endsAt` moet `this.currentTimeLimitSec` gebruiken |
| `git push` geeft een fout over "upstream" | De branch bestaat nog niet op GitHub | Gebruik precies `git push -u origin feature_Tijdslimiet` |

Kom je er niet uit? Kijk met `git diff` naar al je wijzigingen en vergelijk ze regel voor regel met deze handleiding.

---

## Samenvatting: wat heb je geleerd?

- **De server is de baas.** Regels (mag het nu? is de waarde geldig?) staan in `Game.js`, niet in de browser.
- **Eén plek voor één ding.** `currentTimeLimitSec` is de enige plek die zegt hoe lang een vraag duurt. Countdown, automatisch sluiten en punten gebruiken hem allemaal, dus ze zijn het altijd met elkaar eens.
- **Het patroon voor een host-actie:** event-naam (stap 3) → handler op de server (stap 4) → `lobby:update` naar iedereen (stap 5) → knop die wacht op de server (stap 6–7). Dit patroon kun je hergebruiken voor nieuwe lobby-instellingen.
- **Testen** geeft zekerheid: eerst de regels met `npm test`, daarna het hele verhaal in de browser.
