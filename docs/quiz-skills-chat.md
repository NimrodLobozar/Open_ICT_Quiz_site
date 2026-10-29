# Quiz website: skills per lobby gemiddeld en een algoritme erop

Chat tussen een student en Claude over het bouwen van een quiz website (React + Express + Prisma). Spelers vullen bij het joinen hun IT-skills in (0-5). Daarvan wordt per lobby een gemiddelde per skill gemaakt, en een algoritme bepaalt welk soort IT-vragen en welke moeilijkheid er komt.

Doel: stap voor stap leren, zonder dat Claude de volledige code geeft.

---

## 1. Het idee

**Vraag:**

> ik ga met mijn squad een quiz website bouwen. spelers moeten bij het joinen of inloggen zijn/haar skills voor it invullen. 0-5 voor bv. GD SCS TI enz. ik moet nu die gaan ophalen uit de code en een gemiddelde maken per skill van de lobby. daar gaat een algoritme voor komen om te bepalen welke soort it vragen meer komen of welke moeilijkheid van een vraag er komt. help mij om dit voor mekaar te krijgen zonder volledige code te geven. maar met een stap voor stap uitleg hoe ik dat doe. zodat ik het later zelf kan

**Antwoord (globaal plan):**

1. **Opslag bepalen.** Skills als aparte kolommen (`gd`, `scs`, `ti`, `Int`) of als aparte tabel.
2. **Invullen bij join/login (frontend).** Slider of `InputNumber` (min 0, max 5), waarden in `useState` als één object, meesturen naar de backend. Valideer ook in de backend (0 t/m 5).
3. **Gemiddelde per skill van de lobby (backend).** Per skill optellen en delen door het aantal spelers. Let op een lege lobby (delen door 0) en spelers zonder ingevulde skills. Liever op de server dan in React.
4. **Algoritme in een eigen functie** (bijv. `questionSelector.js`):
   - Invoer: gemiddelde per skill, bijv. `{ gd: 3.2, scs: 1.5, ti: 4.0 }`.
   - Moeilijkheid: koppel het gemiddelde aan een niveau (bijv. 0-1.7 makkelijk, 1.7-3.4 gemiddeld, 3.4-5 moeilijk), grenzen als constanten.
   - Welke soort vragen vaker komen: meer over sterke skills, of meer over zwakke skills. Dit is een ontwerpkeuze voor het team.
   - Gewogen willekeurig kiezen (zoek op: *weighted random selection*).
5. **Koppelen aan de vragenbank.** Elke vraag heeft minimaal `skill` en `difficulty`, dan is het een filter.
6. **Testen.** Gemiddelde-functie met nepdata narekenen, algoritme 1000 keer draaien en tellen hoe vaak elke skill voorkomt.

---

## 2. Stap 1: waar komen de skills in de database?

**Vraag:** hoe doe ik stap 1?

**Antwoord:** (eerste versie, nog zonder zicht op het echte schema)

- Open `prisma/schema.prisma`, zoek het model met je spelers.
- Voeg per skill een `Int`-veld toe met `@default(0)`.
- Migreren met `npx prisma migrate dev --name add_skills`, controleren met `npx prisma studio`.
- Let op Docker: het commando moet soms binnen de backend-container draaien.

### Het echte schema (geplakt door de student)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// Live games staan in het geheugen van de server (backend/game/). De database bewaart alleen
// wat er gespeeld is: één GameSession per ronde, met één GameResult per speler (projectplan 12).
// Zo kost elk antwoord geen databasequery, en raak je alleen een lopende game kwijt als de server herstart.

// Eén gespeelde ronde. Herstart de host, dan komt er een nieuwe rij met dezelfde code en round + 1.
model GameSession {
  id        Int          @id @default(autoincrement())
  code      String // de lobbycode; niet uniek, want codes worden later opnieuw uitgedeeld
  round     Int          @default(1)
  startedAt DateTime // moment dat de lobby (opnieuw) openging
  endedAt   DateTime     @default(now()) // moment van het podium
  results   GameResult[]

  @@index([code])
}

// De eindstand van één speler in één ronde.
model GameResult {
  id           Int         @id @default(autoincrement())
  sessionId    Int
  session      GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  nickname     String
  score        Int
  // rank wordt hier wél opgeslagen: het is een momentopname van getRanking() op het podium,
  // zodat de database precies laat zien wat de spelers zagen.
  rank         Int
  correctCount Int
  skills       Json        @default("{}") // de ervaring-sliders van de joinpagina
  isBot        Boolean     @default(false) // testspelers van dev:finish, zodat je ze kunt wegfilteren

  @@index([sessionId])
}
```

**Conclusie van Claude:** er is geen User/Player-model. Spelers bestaan tijdens een live game alleen in het geheugen van de server (`backend/game/`). De database bewaart pas aan het einde iets in `GameResult`, inclusief een `skills Json`-veld. Voor het gemiddelde tijdens de lobby is dus **geen migratie** nodig. Het kolommen-advies viel daarmee weg.

**Nieuwe stap 1 = onderzoeken wat er al is:**

1. Open de joinpagina en zoek de sliders: welke skills, welke sleutels, welke min/max.
2. Volg de data naar de server (welk bericht of welke route).
3. Zoek de ontvangende kant in `backend/game/`.
4. Controleer de vorm van `skills` met een tijdelijke `console.log`.

---

## 3. De frontend: de sliders

Code van de student (joinpagina):

```jsx
const skillDefinitions = [
  { label: 'SD', color: '#f59e0b' },
  { label: 'AI', color: '#14b8a6' },
  { label: 'TI', color: '#facc15' },
  { label: 'CSC', color: '#6366f1' },
  { label: 'GD', color: '#22c55e' },
  { label: 'BI', color: '#3b82f6' },
]

function SkillSlider({ label, color, value, onChange }) {
  return (
    <div className="skill-slider">
      <span className="skill-label">
        <span className="skill-dot" style={{ backgroundColor: color }} aria-hidden="true" />
        {label}
      </span>
      <Slider value={value} onChange={onChange} min={0} max={5} style={{ flex: 1 }} />
      <strong>{value}</strong>
    </div>
  )
}

<Form.Item label="Vul hier jouw vaardigheden in: (0-5)" required style={{ marginBottom: '2.5vh' }}>
  <div className="skills-list">
    {skillDefinitions.map((skill) => (
      <SkillSlider
        key={skill.label}
        {...skill}
        value={skillValues[skill.label]}
        onChange={(value) => setSkillValues((current) => ({ ...current, [skill.label]: value }))}
      />
    ))}
  </div>
</Form.Item>
```

**Wat Claude hieruit haalde:**

- Zes skills: `SD`, `AI`, `TI`, `CSC`, `GD`, `BI`. (Let op: eerder werd "SCS" gezegd, in de code heet het **CSC**. Gebruik altijd de sleutels uit de code, hoofdletters meegerekend.)
- Bereik 0-5 klopt al.
- `skillValues` is een object met de labels als sleutels, met echte getallen (geen strings).
- `skillDefinitions` is de enige plek met skillnamen. Gebruik dezelfde sleutels later in het algoritme.

### Startwaarde

```jsx
const [skillValues, setSkillValues] = useState(
  () => Object.fromEntries(skillDefinitions.map(({ label }) => [label, 5])),
)
```

Alle skills beginnen op 5. De student legde uit dat de speler de sliders zelf instelt voordat hij kan joinen, en dat de gekozen waarden zichtbaar op het scherm staan. Daarmee is 5 als startwaarde niet echt een probleem. Een middenwaarde als start zou wel minder scheve gemiddelden geven, maar dat is een kleine keuze.

### De rekenmethode van de student

> je alle waardes van 1 beroepsrol samentelt en dan kijkt wat het gemiddelde is voor de moeilijkheid van dat soort vragen. of dat je juist meer vragen krijgt van een onderwerp waar de minste vaardigheid bij is.

Bouwen in stappen:

1. Per skill optellen en delen door het **aantal spelers** (en lege lobby afvangen).
2. Resultaat: een object met zes gemiddelden, met dezelfde sleutels als `skillDefinitions`.
3. Moeilijkheid: gemiddelde koppelen aan een niveau met vaste grenzen.
4. Welk onderwerp vaker: de skill met het laagste gemiddelde krijgt een hoger gewicht in een willekeurige keuze. Niet altijd "de laagste kiezen", anders krijgt de lobby steeds hetzelfde onderwerp. Voorbeeld: gewicht = 6 min het gemiddelde.
5. Gelijkspel: bij een gewichtenmethode geen probleem, bij "kies de laagste" heb je een tie-break nodig.

---

## 4. Hoe komen de skills bij de server?

Frontend-code (invoer van de lobbycode en joinen):

```jsx
<Form className="code-form" layout="vertical" onFinish={checkCode}>
  ...
</Form>

<Form form={form} layout="vertical" onFinish={join}>
  ... (nickname + sliders + Join-knop)
</Form>
```

en de verzendregel:

```jsx
try {
  await api(`/games/${code}/players`, { method: 'POST', body: { nickname, skills: skillValues } })
  navigate(`/play/${code}`)
} catch (apiError) {
  setError(apiError.message)
  setSending(false)
}
```

**Uitleg:**

- `api(...)` is een eigen hulpfunctie rond `fetch`, daarom is er geen losse `fetch` of `socket.emit` te vinden.
- De route is `POST /games/:code/players`.
- Het pakket is `{ nickname, skills }`, waarbij `skills` het object met zes getallen is.

### De serverroute (`backend/routes/games.js`)

```javascript
// Joinen met een naam.
router.post('/:code/players', (request, response) => {
  const { code } = request.params
  const game = findGame(code)

  // Zit deze browser al in deze game? Dan geen tweede speler maken, gewoon terugsturen.
  const existing = readSession(request, PLAYER_COOKIE, code)
  const existingPlayer = existing && game.getPlayer(existing.playerId)
  if (existingPlayer) {
    return response.json({ playerId: existingPlayer.id, nickname: existingPlayer.nickname })
  }

  const player = game.addPlayer(request.body?.nickname, { skills: request.body?.skills })
  const token = gameManager.createSession({ code, role: 'player', playerId: player.id })
  setSessionCookie(response, PLAYER_COOKIE, token)
  sendLobbyUpdate(getIo(request), game)
  response.status(201).json({ playerId: player.id, nickname: player.nickname })
})
```

De route maakt de speler niet zelf aan, maar roept `game.addPlayer(...)` aan. Tip: klik op een functienaam en druk **F12** om naar de definitie te springen (**Alt + pijl links** om terug te gaan).

### `addPlayer` en de constructor (`backend/game/`)

```javascript
/** Nieuwe speler in de lobby. Gooit een GameError als het niet mag. */
addPlayer(rawNickname, { isBot = false, skills } = {}) {
  if (this.phase !== PHASES.LOBBY)
    throw new GameError("WRONG_PHASE", "De quiz is al begonnen.", 403);
  if (this.locked)
    throw new GameError("LOBBY_LOCKED", "Deze lobby is gesloten.", 403);

  const nickname = normalizeName(rawNickname);
  const invalid = validateName(nickname);
  if (invalid)
    throw new GameError(
      invalid,
      "Gebruik 2 tot 20 letters, cijfers, spaties, - _ of .",
      400,
    );

  const key = nameKey(nickname);
  if (
    [...this.players.values()].some(
      (player) => nameKey(player.nickname) === key,
    )
  ) {
    throw new GameError(
      "NAME_TAKEN",
      "Deze naam is al bezet. Kies een andere naam.",
      409,
    );
  }

  const player = {
    id: this.nextPlayerId++,
    nickname,
    score: 0,
    correctCount: 0,
    // Punten per vraag. De totaalscore is altijd de som hiervan, zo kun je het narekenen.
    answers: [],
    connected: false,
    isVerified: false, // pas true met een account (L1)
    isBot,
    skills: cleanSkills(skills),
  };
  this.players.set(player.id, player);
  return player;
}
```

```javascript
constructor(code, { questions = QUIZ_QUESTIONS, previewSeconds = 5 } = {}) {
  this.code = code;
  this.phase = PHASES.LOBBY;
  this.locked = false;
  this.questions = questions;
  this.previewSeconds = previewSeconds;
  this.#resetQuestions();
  /** @type {Map<number, Player>} */
  this.players = new Map();
  this.nextPlayerId = 1;
  this.finalRanking = null;
  this.round = 1;
  this.startedAt = new Date();
}
```

**Wat we nu weten:**

1. Spelers worden aangemaakt in `addPlayer`, in de game-klasse.
2. `skills` wordt opgeslagen: `skills: cleanSkills(skills)`.
3. `this.players` is een **`Map`** met speler-id als sleutel en het spelerobject als waarde.

Dus: Map, dan speler (via id), dan `skills`, dan `SD`, `AI`, enzovoort.

- Eén speler: `this.players.get(id).skills`
- Alle spelers: loop over `this.players.values()` (patroon staat al in `addPlayer`: `[...this.players.values()]`)

**Nog te controleren:** wat `cleanSkills` precies doet (welke sleutels laat het door, wat gebeurt er met waarden buiten 0-5).

---

## 5. De gemiddelde-functie (aanpak)

Plek: een nieuwe methode in dezelfde klasse als `addPlayer`, bijvoorbeeld `getSkillAverages()`. Dan heeft hij direct toegang tot `this.players` en hoef je niets te importeren.

1. Gebruik dezelfde lijst met skillnamen als `cleanSkills`, zodat namen niet dubbel worden onderhouden.
2. Haal de spelers op met `[...this.players.values()]`.
3. Beslis welke spelers meetellen (bots met `isBot` waarschijnlijk niet).
4. Lege lobby afvangen: geen deling door 0.
5. Per skill optellen en delen door het aantal spelers (`reduce` of een gewone `for...of`).
6. Geef een object terug met dezelfde sleutels, bijv. `{ SD: 3.2, AI: 1.8, ... }`.

**Testen:** tijdelijk `console.log(game.getSkillAverages())` in de route na `addPlayer`, join met twee spelers (bijv. 0 en 4, gemiddelde moet 2 zijn), en test ook een lobby met één speler.

**Daarna:** het algoritme in een apart bestand, met de gemiddelden als invoer.

---

## 6. Importeren en exporteren

**Vraag:** als ik dit wil importen in een andere file, wat moet ik dan doen als import?

**Antwoord:**

1. Kijk welk systeem jullie gebruiken: `import ... from` (ES modules) of `require(...)` (CommonJS). Je kunt ook in `backend/package.json` zoeken op `"type": "module"`.
2. Eerst **exporteren**, dan **importeren**:
   - ES modules, benoemd: `export const x = ...` en `import { x } from './pad/bestand.js'`
   - ES modules, default: `export default x` en `import x from './pad/bestand.js'`
   - CommonJS: `module.exports = { x }` en `const { x } = require('./pad/bestand')`
3. Veelgemaakte fouten: `.js` vergeten bij ES modules, verkeerd pad (`./` en `../`), accolades fout.

### De lijst met skillnamen in een eigen bestand

1. Maak een nieuw bestand, bijvoorbeeld `skills.js`, in een eigen map.
2. Zet de lijst erin en exporteer hem (verplaats, niet kopiëren).
3. Importeer hem waar nodig.
4. Verwijder de oude lijst en test.

**Let op:** frontend en backend zijn aparte projecten. Je kunt niet zomaar tussen de twee importeren, dus je hebt waarschijnlijk **twee** lijsten nodig die exact dezelfde sleutels moeten hebben. In de backend kun je één `skills.js` maken die zowel `cleanSkills` als `getSkillAverages()` importeren.

De skills van de spelers zelf importeer je niet. Een andere file krijgt die data als argument mee, bijvoorbeeld `berekenGemiddelde(game.players)`.

---

## Samenvatting van de volgende stappen

1. `cleanSkills` openen (F12) en kijken welke sleutels en waarden het doorlaat.
2. Lijst met skillnamen verplaatsen naar een eigen bestand (frontend en backend aparte lijst).
3. `getSkillAverages()` schrijven in de game-klasse en testen met `console.log`.
4. Algoritme in een apart bestand (`questionSelector.js`) met gewogen willekeurige keuze.
5. Vragen in de vragenbank voorzien van `skill` en `difficulty`.
6. Testen: gemiddelde narekenen en het algoritme 1000 keer draaien.
