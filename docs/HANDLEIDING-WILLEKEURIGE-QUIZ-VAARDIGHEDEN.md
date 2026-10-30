# Handleiding: willekeurige quiz op basis van de vaardigheden in de lobby

Deze handleiding is geschreven voor iemand die **nog nooit** aan deze code (of aan software) heeft gewerkt. Je hoeft niets zelf te bedenken: elke stap zegt **welk bestand**, **waar** in dat bestand, en **welke code** je toevoegt. Onder elke stap staat ook **waarom**, zodat je leert hoe de app werkt.

Trek er ongeveer 4 tot 5 uur voor uit. Doe de stappen **in volgorde**. Je kunt na stap 6 een pauze nemen: dan is de server-kant (het algoritme) af en getest.

> Deze handleiding bouwt verder op een chat (`docs/quiz-skills-chat.md`) over "skills per lobby gemiddeld en een algoritme erop". In hoofdstuk 0 staat wat er in die chat besproken is en welke adviezen in deze codebase net anders uitpakken.

---

## De user story

> **Als** host
> **wil ik** een willekeurige quiz kunnen starten waarvan de vragen gekozen worden op basis van de vaardigheden van de spelers in de lobby
> **zodat** de quiz past bij het niveau van de groep en spelers leren over de onderwerpen die ze nog het minst kennen.

**Acceptatiecriteria**

1. In het beheerportaal kan de host naast zijn eigen quizzen ook kiezen voor **Willekeurige quiz hosten**.
2. In de lobby van een willekeurige quiz kiest de host het aantal vragen: 5, 10, 15 of 20.
3. De host ziet in de lobby het gemiddelde per vaardigheid (SD, AI, TI, CSC, GD, BI) van de spelers die meedoen.
4. Bij de start kiest de server de vragen uit een vaste vragenbank: **vaker** vragen over de zwakste vaardigheden, met een **moeilijkheid** die past bij het gemiddelde van de lobby.
5. Geen vraag komt twee keer voor in één ronde. Bij "Opnieuw spelen" worden de vragen opnieuw gekozen.

**Kwaliteitscriteria**

- Het algoritme staat in een eigen bestand en is getest (ook een test die het 1000 keer draait).
- Alleen de server kiest de vragen en kent de goede antwoorden; een browser kan het algoritme niet beïnvloeden.

> Deze story is opgesteld uit de chat en de beschrijving van het team. Zet hem in de backlog en pas hem aan als het team iets anders wil.

---

## 0. Wat is er besproken, wat is er al, en wat bouw jij?

### 0.1 De chat in het kort

In de chat vroeg een student hoe je de vaardigheden die spelers bij het joinen invullen (0 t/m 5 per vaardigheid) per lobby kunt middelen, en hoe een algoritme daarmee bepaalt **welk soort** vragen vaker komt en **hoe moeilijk** ze zijn. De belangrijkste afspraken uit de chat:

- **Gemiddelde per vaardigheid** van de lobby, op de server (niet in React). Let op een lege lobby: nooit delen door 0.
- **Moeilijkheid** koppelen aan het gemiddelde met vaste grenzen: 0 tot 1,7 = makkelijk, 1,7 tot 3,4 = gemiddeld, 3,4 tot 5 = moeilijk.
- **Welk onderwerp vaker:** de student koos voor _meer vragen over de zwakste vaardigheid_. Niet altijd de laagste kiezen (dan krijg je steeds hetzelfde onderwerp), maar een **gewogen willekeurige keuze** met gewicht = 6 min het gemiddelde.
- **Vragen** krijgen een `skill` en een `difficulty`, dan is kiezen gewoon filteren.
- **Testen:** gemiddelde narekenen met nepdata, en het algoritme 1000 keer draaien en tellen.

### 0.2 Waar deze handleiding afwijkt van de chat

De chat zag maar een deel van de code. In deze codebase pakken een paar dingen anders uit:

| In de chat                                                                                              | In deze codebase                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Voeg kolommen toe en draai `npx prisma migrate dev`."                                                  | **Niet nodig.** Spelers van een live game staan in het geheugen van de server (`backend/game/Game.js`), met hun `skills` er al bij. Het project gebruikt ook geen migraties maar `prisma db push`. Deze handleiding verandert de database niet.       |
| "Frontend en backend kunnen niet van elkaar importeren, dus je hebt twee lijsten met skillnamen nodig." | **Wel één lijst.** De map `src/utils/` wordt gedeeld: Docker zet hem ook in de backend-container. `src/utils/skills.js` bestaat al, met `SKILL_CODES` (`SD`, `AI`, `TI`, `CSC`, `GD`, `BI`), en de backend gebruikt hem al in `backend/routes/me.js`. |
| "Deel door het aantal spelers."                                                                         | **Deel door het aantal spelers dat die vaardigheid heeft ingevuld**, en tel testspelers (bots) niet mee. Anders trekt een speler zonder ingevulde waarde het gemiddelde omlaag.                                                                       |
| "Kijk wat `cleanSkills` doet."                                                                          | Gedaan: `cleanSkills` (onderaan `Game.js`) laat alleen hele getallen van 0 t/m 5 door, maar accepteert elke naam tot 40 tekens. Dat is geen probleem: het gemiddelde loopt alleen over `SKILL_CODES`, dus onbekende namen tellen nergens mee.         |
| "Haal de vragen uit de vragenbank met `skill` en `difficulty`."                                         | Quizzen uit de database (gemaakt in het beheerportaal) blijven **precies zoals ze zijn**. De willekeurige quiz gebruikt een **vaste vragenbank in de code** (`backend/game/questionBank.js`), net zoals `backend/game/quizQuestions.js` dat al doet.  |

### 0.3 Wat bestaat al, wat bouw jij?

| Onderdeel                                              | Bestaat al?           | Waar zit het?                                                                              |
| ------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------ |
| Spelers vullen vaardigheden in bij het joinen          | Ja                    | `src/pages/JoinPage/JoinPage.jsx` (sliders), verstuurd met `POST /api/games/:code/players` |
| De server bewaart ze bij de speler                     | Ja                    | `Game.addPlayer` in `backend/game/Game.js`: `skills: cleanSkills(skills)`                  |
| Eén gedeelde lijst met vaardigheden                    | Ja                    | `src/utils/skills.js` (`SKILLS`, `SKILL_CODES`)                                            |
| Balkjes om vaardigheden te tonen                       | Ja                    | `SkillBars` in `src/components/AccountUi.jsx` (gebruikt op Mijn account)                   |
| Gemiddelde per vaardigheid van de lobby                | **Nee, dit bouw jij** | —                                                                                          |
| Vragenbank met vaardigheid en moeilijkheid             | **Nee, dit bouw jij** | —                                                                                          |
| Het algoritme dat vragen kiest                         | **Nee, dit bouw jij** | —                                                                                          |
| Knop "Willekeurige quiz hosten" + aantal vragen kiezen | **Nee, dit bouw jij** | —                                                                                          |

### Wat de host straks ziet

In het beheerportaal (`/admin`):

```
  HOI DOCENT!                      ( Willekeurige quiz hosten )  [ + Nieuwe quiz ]
```

In de lobby van een willekeurige quiz:

```
            Ga naar 192.168.1.20:5173/join en vul in:
                         464816
                      [ 🔓 Open ]

           ┌──────────── Willekeurige quiz ────────────┐
           │               Aantal vragen               │
           │      ( 5 )  [ 10 ]  ( 15 )  ( 20 )        │
           │              ^^^^ gekozen = oranje        │
           │  Gemiddelde vaardigheden van deze lobby.  │
           │  SD  ██████████████░░░░░░  3.5/5          │
           │  AI  ████░░░░░░░░░░░░░░░░    1/5          │
           │  TI  ...                                  │
           └───────────────────────────────────────────┘

                        2 spelers
                      Emma   Daan
                    [ Quiz starten ]
```

En een speler ziet in de wachtruimte: **Willekeurige quiz: 10 vragen, gekozen op de vaardigheden van deze lobby.**

---

## 1. Een paar woorden die je moet kennen

| Woord                         | Betekenis in deze app                                                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**                  | Wat in de browser draait: de schermen. Staat in de map `src/`. Gemaakt met **React**.                                                                                                     |
| **Backend / server**          | Het programma dat op de server draait en de regels bewaakt. Staat in `backend/`.                                                                                                          |
| **Host**                      | De docent die de quiz op het grote scherm laat zien.                                                                                                                                      |
| **Lobby**                     | De wachtruimte vóór de quiz start.                                                                                                                                                        |
| **Vaardigheid (skill)**       | Hoe goed een speler zichzelf vindt in een onderdeel van Open ICT, van 0 t/m 5. De codes: `SD`, `AI`, `TI`, `CSC`, `GD`, `BI`.                                                             |
| **Gemiddelde**                | Alle waarden optellen en delen door hoeveel het er zijn. (0 + 4) / 2 = 2.                                                                                                                 |
| **Vragenbank**                | Een lijst met veel vragen. Uit die lijst kiest het algoritme er een paar voor één ronde.                                                                                                  |
| **Moeilijkheid (difficulty)** | 1 = makkelijk, 2 = gemiddeld, 3 = moeilijk.                                                                                                                                               |
| **Gewicht**                   | Hoe groot de kans is dat iets gekozen wordt. Gewicht 6 heeft zes keer zoveel kans als gewicht 1.                                                                                          |
| **Algoritme**                 | Een vast stappenplan dat de computer uitvoert. Hier: "kies vragen die bij deze lobby passen".                                                                                             |
| **Pure functie**              | Een functie die alleen met haar invoer rekent en niets anders verandert. Dezelfde invoer geeft dezelfde uitvoer. Zo'n functie is makkelijk te testen.                                     |
| **Socket.IO / event / ack**   | De "telefoonlijn" tussen browser en server. Een **event** is een bericht met een naam (bijv. `host:lock`); de **ack** is het antwoord: `{ ok: true }` of `{ ok: false, message: "..." }`. |
| **Component / state**         | Een bouwsteen van een scherm in React / wat een scherm op dit moment "weet".                                                                                                              |
| **Test**                      | Een klein stukje code dat controleert of jouw code doet wat het moet doen. Draai je met `npm test`.                                                                                       |

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
2. Open een terminal in VS Code: menu **Terminal → New Terminal**. Alle commando's in deze handleiding typ je daar, en je drukt daarna op **Enter**.

### 2.3 Een eigen branch maken

Een _branch_ is je eigen kopie van de code waarin je veilig kunt werken. We beginnen vanaf `dev` (zo is het afgesproken in dit team):

```bash
git checkout dev
git pull
git checkout -b feature_WillekeurigeQuiz
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

Onderaan moet staan: **Tests ... passed** en geen `failed`. Onthoud het aantal tests: straks komen er 13 bij. Staat er wel `failed`? Stop dan en vraag hulp: dan was er al iets kapot vóór jouw werk.

### 2.5 Hoe je een bestand vindt en een regel zoekt

- **Bestand openen:** druk `Ctrl+P`, typ de naam (bijv. `Game.js`) en druk Enter.
- **Iets zoeken in een bestand:** druk `Ctrl+F` en typ een stukje van de regel die in deze handleiding staat.
- **Naar een regelnummer:** druk `Ctrl+G` en typ het nummer. De regelnummers kloppen voor de code zoals hij nu is; zodra je zelf regels toevoegt, schuift alles eronder op. Zoek daarom liever met `Ctrl+F`.
- **Nieuw bestand:** klik links in de verkenner met de **rechtermuisknop** op de map → **New File…** → typ de naam → Enter.
- **Opslaan:** `Ctrl+S`. Vergeet dit niet na elke stap!

> **Heb je de handleiding "Tijdslimiet per vraag" al gedaan?** Dan staat er in sommige regels al iets extra's, zoals `timeLimitSec: game.timeLimitSec`. Laat dat gewoon staan en voeg jouw regels erbij. Waar dat speelt, staat het bij de stap.

---

## 3. Het plan in één plaatje

```
 BEHEERPORTAAL (host)              SERVER                                   SPELERS
 ────────────────────              ──────                                   ───────
 klikt "Willekeurige quiz hosten"
   │  POST /api/games { random: true }
   └──────────────────────────▶  routes/games.js
                                   new Game(code, { questionBank })  ← nog géén vragen gekozen
                                                                            joinen met sliders
                                   game.addPlayer(naam, { skills }) ◀────── { SD: 4, AI: 1, ... }
                                   │  lobby:update { ..., questionCount: 10,
                                   │                 skillAverages: { SD: 3.5, AI: 1, ... } }
   ◀───────────────────────────────┴──────────────────────────────────────▶ "10 vragen"
 ziet balkjes per vaardigheid

 klikt "15"  ── host:set-question-count { count: 15 } ──▶ game.setQuestionCount(15)
                                                          (lobby:update naar iedereen)

 klikt "Quiz starten" ── host:start ──▶ game.start()
                                          selectQuestions(vragenbank, gemiddelden, 15)
                                          1. kies een vaardigheid (zwakste = meeste kans)
                                          2. kies de moeilijkheid die bij het gemiddelde past
                                          3. pak een vraag die past, haal hem uit de pot
                                          ... 15 keer
                                        daarna gaat de quiz verder zoals altijd
```

**Belangrijk idee:** de **server** kiest de vragen, op het moment van starten. Pas dan weet je wie er meedoen. En alleen de server kent de goede antwoorden; een browser krijgt een vraag altijd zonder `isCorrect` (zie `getQuestionPayload` in `Game.js`).

### Welke bestanden je aanraakt

| #   | Bestand                                                            | Wat                                                         |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1   | `src/utils/randomQuiz.js`                                          | **Nieuw:** titel en keuzes voor het aantal vragen (gedeeld) |
| 2   | `backend/game/questionBank.js`                                     | **Nieuw:** de vragenbank (36 vragen)                        |
| 3   | `backend/game/questionSelector.js`                                 | **Nieuw:** het algoritme                                    |
| 4   | `backend/tests/questionSelector.test.js`                           | **Nieuw:** tests voor stap 2 en 3                           |
| 5   | `backend/game/Game.js`                                             | Gemiddelde, aantal vragen, vragen kiezen bij de start       |
| 6   | `backend/tests/Game.test.js`                                       | Tests voor stap 5                                           |
| 7   | `backend/routes/games.js`                                          | Een willekeurige quiz aanmaken                              |
| 8   | `backend/tests/api/quizzes.test.js`                                | Test voor stap 7                                            |
| 9   | `backend/socket/events.js` en `src/socket/events.js`               | Naam van het nieuwe event                                   |
| 10  | `backend/socket/hostHandlers.js`                                   | Het event van de host ontvangen                             |
| 11  | `backend/socket/broadcast.js` en `backend/socket/syncState.js`     | Aantal vragen en gemiddelden meesturen                      |
| 12  | `src/components/QuestionCountPicker.jsx` + `.css`                  | **Nieuw:** de keuzeknoppen                                  |
| 13  | `src/pages/Admin/OverviewPage.jsx`, `QuizzesPage.jsx`, `Admin.css` | De knop "Willekeurige quiz hosten"                          |
| 14  | `src/pages/HostGamePage/HostGamePage.jsx` + `.css`                 | Aanmaken + de lobby van de host                             |
| 15  | `src/pages/PlayerGamePage/PlayerGamePage.jsx`                      | Spelers zien hoeveel vragen er komen                        |
| 16  | `docs/SOCKET-EVENTS.md`                                            | Documentatie                                                |

We beginnen bij de regels (algoritme en `Game.js`), dan de verbinding, en als laatste de schermen.

---

## Stap 1: Gedeelde instellingen

**Nieuw bestand:** `src/utils/randomQuiz.js`

Plak deze code erin:

```js
// Instellingen van een willekeurige quiz. Gedeeld door frontend (keuzeknoppen) en backend (controle in Game.js),
// zodat er maar één lijst met keuzes is.
export const RANDOM_QUIZ_TITLE = "Willekeurige quiz";

// Hoeveel vragen de host in de lobby kan kiezen.
export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];
export const DEFAULT_QUESTION_COUNT = 10;
```

**Waarom in `src/utils/`?** Deze map gebruiken frontend én backend (Docker zet hem ook in de backend-container, zie `docker-compose.yml`). De knoppen in de browser en de controle op de server lezen dus **dezelfde** lijst. Wil het team later 25 vragen kunnen kiezen, dan pas je alleen deze regel aan.

**Waarom `export`?** Zonder `export` kan geen ander bestand deze waarden gebruiken. Met `export const X` maak je hem beschikbaar; een ander bestand haalt hem op met `import { X } from '...'`.

Sla op.

---

## Stap 2: De vragenbank

**Nieuw bestand:** `backend/game/questionBank.js`

Elke vraag krijgt, naast de tekst en de antwoorden, een **vaardigheid** (`skill`) en een **moeilijkheid** (`difficulty`). Per vaardigheid staan er 2 makkelijke, 2 gemiddelde en 2 moeilijke vragen in: 6 × 6 = 36 vragen.

Plak deze code erin (het is lang, maar je kunt het in één keer kopiëren):

```js
// De vragenbank voor een willekeurige quiz. Uit deze lijst kiest questionSelector.js de vragen,
// op basis van de vaardigheden van de spelers in de lobby.
//
// skill: één van de codes uit src/utils/skills.js (SD, AI, TI, CSC, GD, BI). Precies zo gespeld, met hoofdletters.
// difficulty: 1 = makkelijk, 2 = gemiddeld, 3 = moeilijk.
//
// Een vraag toevoegen? Zet hem bij de goede vaardigheid en draai `npm test`:
// de test "de vragenbank" controleert of alles klopt.
export const QUESTION_BANK = [
  // ---------- SD: software development ----------
  bankQuestion(
    "SD",
    1,
    "Welke van deze talen draait standaard in de browser?",
    [["Python"], ["JavaScript", true], ["C#"], ["PHP"]],
  ),
  bankQuestion("SD", 1, "Wat doet git commit?", [
    ["Code naar GitHub sturen"],
    ["Een nieuwe branch maken"],
    ["Wijzigingen lokaal vastleggen", true],
    ["Twee branches samenvoegen"],
  ]),
  bankQuestion(
    "SD",
    2,
    "Wat geeft [1, 2, 3].map((x) => x * 2) in JavaScript?",
    [["[2, 4, 6]", true], ["12"], ["[1, 2, 3, 1, 2, 3]"], ["6"]],
  ),
  bankQuestion(
    "SD",
    2,
    "Welke HTTP-methode gebruik je meestal om iets nieuws aan te maken in een REST-API?",
    [["GET"], ["DELETE"], ["HEAD"], ["POST", true]],
  ),
  bankQuestion(
    "SD",
    3,
    "Hoe snel is binair zoeken in een gesorteerde lijst (tijdscomplexiteit)?",
    [["O(1)"], ["O(log n)", true], ["O(n)"], ["O(n²)"]],
  ),
  bankQuestion("SD", 3, 'Waar staat de "S" voor in de SOLID-principes?', [
    ["Static typing"],
    ["Secure by default"],
    ["Single responsibility", true],
    ["Separation of data"],
  ]),

  // ---------- AI: artificial intelligence ----------
  bankQuestion("AI", 1, "Waar staat de afkorting AI voor?", [
    ["Automatische Invoer"],
    ["Artificial Intelligence", true],
    ["Advanced Internet"],
    ["Analoge Informatica"],
  ]),
  bankQuestion("AI", 1, "Waar leert een machine-learningmodel van?", [
    ["Van data", true],
    ["Van een snellere muis"],
    ["Van een groter beeldscherm"],
    ["Van een printer"],
  ]),
  bankQuestion(
    "AI",
    2,
    "Hoe heet leren met voorbeelden waarvan het goede antwoord (label) al bekend is?",
    [
      ["Unsupervised learning"],
      ["Reinforcement learning"],
      ["Supervised learning", true],
      ["Deep linking"],
    ],
  ),
  bankQuestion("AI", 2, "Wat betekent overfitting?", [
    ["Het model is te groot voor de computer"],
    [
      "Het model leert de trainingsdata uit het hoofd en werkt slecht op nieuwe data",
      true,
    ],
    ["Het model traint te snel"],
    ["Het model heeft te weinig opslag"],
  ]),
  bankQuestion(
    "AI",
    3,
    "Waarvoor gebruik je een validatieset bij het trainen van een model?",
    [
      ["Om het model sneller te maken"],
      ["Om de trainingsdata groter te maken"],
      ["Om het model op te slaan"],
      [
        "Om instellingen te kiezen en overfitting te zien, met data waarop niet getraind is",
        true,
      ],
    ],
  ),
  bankQuestion("AI", 3, "Welke activatiefunctie berekent max(0, x)?", [
    ["Sigmoid"],
    ["ReLU", true],
    ["Softmax"],
    ["Tanh"],
  ]),

  // ---------- TI: technische informatica ----------
  bankQuestion("TI", 1, "Hoeveel bits zitten er in één byte?", [
    ["4"],
    ["8", true],
    ["16"],
    ["32"],
  ]),
  bankQuestion(
    "TI",
    1,
    "Welk onderdeel van een computer voert de berekeningen uit?",
    [["De voeding"], ["De harde schijf"], ["De CPU", true], ["De ventilator"]],
  ),
  bankQuestion(
    "TI",
    2,
    "Wat is het binaire getal 1010 in het tientallige stelsel?",
    [["8"], ["10", true], ["12"], ["20"]],
  ),
  bankQuestion(
    "TI",
    2,
    "Wat doet een pull-up-weerstand bij een knop op een microcontroller?",
    [
      ["De ingang hoog houden als de knop niet is ingedrukt", true],
      ["De knop sneller laten reageren"],
      ["De spanning verhogen naar 12 volt"],
      ["De stroom meten"],
    ],
  ),
  bankQuestion(
    "TI",
    3,
    "Hoeveel verschillende waarden kun je opslaan in 10 bits?",
    [["100"], ["512"], ["2048"], ["1024", true]],
  ),
  bankQuestion(
    "TI",
    3,
    "Wat is het hexadecimale getal 0xFF in het tientallige stelsel?",
    [["15"], ["255", true], ["256"], ["1600"]],
  ),

  // ---------- CSC: cyber security en cloud ----------
  bankQuestion("CSC", 1, "Wat is phishing?", [
    ["Een soort firewall"],
    ["Een programmeertaal"],
    ["Nepberichten om gegevens te stelen", true],
    ["Een back-upmethode"],
  ]),
  bankQuestion("CSC", 1, "Welk wachtwoord is het veiligst?", [
    ["Je geboortedatum"],
    ["Een lang wachtwoord dat je nergens anders gebruikt", true],
    ["Hetzelfde wachtwoord voor alle websites"],
    ["Alleen kleine letters"],
  ]),
  bankQuestion("CSC", 2, "Waar staat de S in HTTPS voor?", [
    ["Speed"],
    ["Server"],
    ["Simple"],
    ["Secure", true],
  ]),
  bankQuestion("CSC", 2, "Wat is tweestapsverificatie (2FA)?", [
    [
      "Inloggen met iets wat je weet én iets wat je hebt, zoals een code op je telefoon",
      true,
    ],
    ["Twee keer je wachtwoord typen"],
    ["Op twee apparaten tegelijk inloggen"],
    ["Een wachtwoord van twee woorden"],
  ]),
  bankQuestion(
    "CSC",
    3,
    "Waarom sla je wachtwoorden op als hash (bijv. bcrypt) en niet als gewone tekst?",
    [
      ["Een hash neemt minder ruimte in"],
      ["Dan kan de gebruiker zonder wachtwoord inloggen"],
      ["Lekt de database, dan kan niemand de wachtwoorden zomaar lezen", true],
      ["Dan kun je het wachtwoord later terugmailen"],
    ],
  ),
  bankQuestion("CSC", 3, "Wat is SQL-injectie?", [
    ["Een snelle manier om een database te vullen"],
    ["Invoer van een gebruiker die als SQL-code wordt uitgevoerd", true],
    ["Een back-up terugzetten"],
    ["Een index toevoegen aan een tabel"],
  ]),

  // ---------- GD: game development ----------
  bankQuestion("GD", 1, "Waar staat FPS voor bij een game?", [
    ["Frames per second", true],
    ["Files per server"],
    ["Fast player speed"],
    ["Free points system"],
  ]),
  bankQuestion("GD", 1, "Wat is een sprite in een 2D-game?", [
    ["Een geluidseffect"],
    ["Een plaatje of figuurtje dat in de game beweegt", true],
    ["Een soort level"],
    ["Een opgeslagen spel"],
  ]),
  bankQuestion(
    "GD",
    2,
    "Waarom vermenigvuldig je een beweging met deltaTime?",
    [
      ["Zodat de game minder geheugen gebruikt"],
      ["Zodat de graphics scherper worden"],
      ["Zodat de snelheid gelijk blijft, ook als de framerate verandert", true],
      ["Zodat het geluid gelijk loopt met het beeld"],
    ],
  ),
  bankQuestion("GD", 2, "Wat is een hitbox?", [
    ["Een doos met power-ups"],
    ["Het pauzemenu van een game"],
    ["Een grafische kaart"],
    ["Een (onzichtbare) vorm waarmee de game botsingen bepaalt", true],
  ]),
  bankQuestion(
    "GD",
    3,
    "Waarvoor gebruikt een 3D-engine meestal een quaternion?",
    [
      ["Om een rotatie op te slaan zonder gimbal lock", true],
      ["Om een kleur op te slaan"],
      ["Om een geluid af te spelen"],
      ["Om een texture te comprimeren"],
    ],
  ),
  bankQuestion("GD", 3, "Wat is culling in game-graphics?", [
    ["Alle objecten twee keer tekenen"],
    ["Objecten die je toch niet ziet, niet tekenen", true],
    ["Textures groter maken"],
    ["De framerate vastzetten"],
  ]),

  // ---------- BI: business en IT ----------
  bankQuestion("BI", 1, "Wat is een database?", [
    ["Een soort beeldscherm"],
    ["Een programmeertaal"],
    ["Een georganiseerde verzameling gegevens", true],
    ["Een netwerkkabel"],
  ]),
  bankQuestion("BI", 1, "Waar staat de afkorting KPI voor?", [
    ["Key Performance Indicator", true],
    ["Klant Product Index"],
    ["Key Program Interface"],
    ["Kwaliteit Per Item"],
  ]),
  bankQuestion("BI", 2, "Welke SQL-opdracht haalt rijen op uit een tabel?", [
    ["GET"],
    ["SELECT", true],
    ["FETCH"],
    ["PULL"],
  ]),
  bankQuestion("BI", 2, "Wat is een stakeholder in een IT-project?", [
    ["De server waarop het project draait"],
    ["Het eerste deel van de code"],
    ["Een soort testscript"],
    ["Iemand die belang heeft bij het project of er invloed op heeft", true],
  ]),
  bankQuestion("BI", 3, "Wat doet GROUP BY in SQL?", [
    [
      "Rijen met dezelfde waarde samennemen, bijvoorbeeld om per groep te tellen",
      true,
    ],
    ["Rijen sorteren"],
    ["Een tabel verwijderen"],
    ["Twee databases koppelen"],
  ]),
  bankQuestion("BI", 3, "Wat is het doel van een database normaliseren?", [
    ["De database sneller laten opstarten"],
    ["Dubbele gegevens voorkomen en de structuur logisch houden", true],
    ["Alle tabellen samenvoegen tot één tabel"],
    ["De gegevens versleutelen"],
  ]),
];

// Korte schrijfwijze, net als in quizQuestions.js: [tekst, true] is het goede antwoord.
// De ids tellen per vraag vanaf 1: de schermen koppelen daar de kleuren en vormen aan.
function bankQuestion(skill, difficulty, text, options, timeLimitSec = 20) {
  return {
    skill,
    difficulty,
    text,
    timeLimitSec,
    options: options.map(([optionText, isCorrect = false], i) => ({
      id: i + 1,
      text: optionText,
      isCorrect,
    })),
  };
}
```

**Uitleg:**

- `bankQuestion('SD', 1, 'Vraag?', [...])` is een korte schrijfwijze. De functie onderaan maakt er een object van in precies de vorm die `Game.js` al kent (`text`, `timeLimitSec`, `options`), plus `skill` en `difficulty`. Kijk maar in `backend/game/quizQuestions.js`: daar staat dezelfde truc.
- `['JavaScript', true]` betekent: dit is het goede antwoord. Zonder `true` is een antwoord fout.
- **Wat de codes betekenen:** de codes komen uit `src/utils/skills.js`. In de commentaarregels staat hoe wij ze lezen (SD = software development, CSC = cyber security en cloud, enzovoort). Gebruikt het team een andere betekenis, pas dan de vragen aan, maar nooit de codes zelf: die moeten precies gelijk zijn aan `SKILL_CODES`.
- **De spelers zien `skill` en `difficulty` niet.** `getQuestionPayload` in `Game.js` kiest zelf welke velden naar de browser gaan (tekst, antwoorden zonder `isCorrect`, tijd). In stap 6 staat een test die dat controleert.

> **Vragen erbij maken?** Dat mag, het algoritme werkt met elke hoeveelheid. Houd per vaardigheid minstens 2 vragen per moeilijkheid aan; de test in stap 4 controleert dat. Hoe meer vragen, hoe minder vaak een lobby dezelfde vraag krijgt.

Sla op.

---

## Stap 3: Het algoritme

**Nieuw bestand:** `backend/game/questionSelector.js`

Dit is het hart van de story. Het bestand is **puur**: het krijgt de gemiddelden en de vragenbank, en geeft gekozen vragen terug. Het weet niets van spelers, sockets of de database. Daardoor kun je het los testen.

Plak deze code erin:

```js
import { SKILL_CODES } from "../../src/utils/skills.js";

// Het algoritme van de willekeurige quiz: welke vragen uit de vragenbank komen erin?
// Puur: gemiddelden en vragen erin, gekozen vragen eruit. Geen Game, geen sockets, geen database.
// Daardoor kun je het testen zonder server (backend/tests/questionSelector.test.js).

export const MAX_SKILL = 5; // het bereik van de sliders is 0 t/m 5

// Grenzen voor de moeilijkheid: 0 tot 1.7 = makkelijk, 1.7 tot 3.4 = gemiddeld, 3.4 tot 5 = moeilijk.
// Als constanten, zodat het team ze op één plek kan bijstellen.
export const EASY_BELOW = 1.7;
export const MEDIUM_BELOW = 3.4;

/**
 * Welke moeilijkheid past bij het gemiddelde van de lobby voor één vaardigheid?
 * null = niemand heeft deze vaardigheid ingevuld: dan gemiddeld (2).
 * @param {number | null} average
 * @returns {1 | 2 | 3}
 */
export function difficultyFor(average) {
  if (average === null) return 2;
  if (average < EASY_BELOW) return 1;
  if (average < MEDIUM_BELOW) return 2;
  return 3;
}

/**
 * Hoe groot de kans is dat een vaardigheid gekozen wordt (het gewicht).
 * Keuze van het team: de ZWAKSTE vaardigheid van de lobby krijgt de meeste vragen,
 * zodat spelers leren over wat ze nog niet goed kennen.
 * Gewicht = 6 - gemiddelde: gemiddelde 0 geeft 6, gemiddelde 5 geeft 1. Nooit 0, dus ook de sterkste komt soms.
 * Wil het team juist meer vragen over sterke vaardigheden? Maak er dan `average + 1` van.
 * @param {number | null} average
 */
export function skillWeight(average) {
  return MAX_SKILL + 1 - (average ?? MAX_SKILL / 2);
}

/**
 * Kiest één item uit de lijst, met een kans naar verhouding van zijn gewicht ("weighted random selection").
 * Voorbeeld: gewichten a = 1 en b = 3 geven a in 1 van de 4 keer en b in 3 van de 4 keer.
 * @param {() => number} random geeft een getal van 0 tot 1; een test geeft hier een vaste functie mee.
 */
export function pickWeighted(items, weightOf, random = Math.random) {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  // Stel je alle gewichten voor als stukken van één lange lat. We prikken op een willekeurige plek
  // en kijken in welk stuk we zitten. Een groter gewicht = een groter stuk = meer kans.
  let ticket = random() * total;
  for (const item of items) {
    ticket -= weightOf(item);
    if (ticket < 0) return item;
  }
  return items[items.length - 1]; // alleen bij afrondingsfoutjes
}

/**
 * Kiest `count` vragen uit de vragenbank, passend bij de lobby. Geen vraag komt twee keer.
 * Per vraag: 1) kies een vaardigheid (gewogen), 2) bepaal de moeilijkheid die bij die vaardigheid past,
 * 3) neem een vraag van die vaardigheid met die moeilijkheid (of de dichtstbijzijnde als ze op zijn).
 * @param {Array<{ skill: string, difficulty: number }>} bank
 * @param {Record<string, number | null>} averages uitkomst van Game.getSkillAverages()
 * @param {number} count
 * @param {() => number} random
 */
export function selectQuestions(bank, averages, count, random = Math.random) {
  // Een kopie: we halen er vragen uit, maar de bank zelf moet heel blijven voor de volgende game.
  const remaining = bank.filter((question) =>
    SKILL_CODES.includes(question.skill),
  );
  const chosen = [];

  while (chosen.length < count && remaining.length > 0) {
    // 1. Welke vaardigheid? Alleen vaardigheden waarvan nog vragen over zijn.
    const skills = SKILL_CODES.filter((code) =>
      remaining.some((question) => question.skill === code),
    );
    const skill = pickWeighted(
      skills,
      (code) => skillWeight(averages[code] ?? null),
      random,
    );

    // 2. Welke moeilijkheid past bij de lobby voor deze vaardigheid?
    const target = difficultyFor(averages[skill] ?? null);

    // 3. De vragen van deze vaardigheid die het dichtst bij die moeilijkheid zitten.
    const ofSkill = remaining.filter((question) => question.skill === skill);
    const distance = (question) => Math.abs(question.difficulty - target);
    const closest = Math.min(...ofSkill.map(distance));
    const candidates = ofSkill.filter(
      (question) => distance(question) === closest,
    );
    const question = candidates[Math.floor(random() * candidates.length)];

    // 4. Opnemen in de quiz en uit de pot halen.
    chosen.push(question);
    remaining.splice(remaining.indexOf(question), 1);
  }
  return chosen;
}
```

Sla op. Lees daarna de uitleg hieronder rustig door: dit is het stuk waar je het meest van leert.

### 3.1 `difficultyFor`: welk niveau past bij een gemiddelde?

Een rij `if`-regels van laag naar hoog. De eerste die klopt, wint (`return` stopt de functie meteen):

| Gemiddelde                    | Uitkomst     |
| ----------------------------- | ------------ |
| `null` (niemand vulde het in) | 2, gemiddeld |
| 0 tot 1,7                     | 1, makkelijk |
| 1,7 tot 3,4                   | 2, gemiddeld |
| 3,4 tot en met 5              | 3, moeilijk  |

Let op: in JavaScript schrijf je een komma-getal met een **punt**: `1.7`, niet `1,7`.

### 3.2 `skillWeight`: hoeveel kans krijgt een vaardigheid?

`MAX_SKILL + 1 - gemiddelde` = `6 - gemiddelde`. Een voorbeeld met een lobby die goed is in SD en slecht in GD:

| Vaardigheid | Gemiddelde | Gewicht | Kans (gewicht / totaal) |
| ----------- | ---------- | ------- | ----------------------- |
| SD          | 5          | 1       | 1 / 11 ≈ 9 %            |
| AI          | 5          | 1       | 9 %                     |
| TI          | 5          | 1       | 9 %                     |
| CSC         | 5          | 1       | 9 %                     |
| GD          | 0          | 6       | 6 / 11 ≈ 55 %           |
| BI          | 5          | 1       | 9 %                     |
| **Totaal**  |            | **11**  | 100 %                   |

GD komt dus ongeveer de helft van de tijd, maar de andere vaardigheden komen ook nog voor. Dat is precies wat de chat bedoelde met "niet altijd de laagste kiezen".

`average ?? MAX_SKILL / 2`: `??` betekent "als links `null` is, neem dan rechts". Heeft niemand een vaardigheid ingevuld, dan rekenen we met 2,5 (het midden).

### 3.3 `pickWeighted`: gewogen willekeurig kiezen

Stel je een lat voor van 11 cm lang (het totaal van de gewichten). Elke vaardigheid krijgt een stuk zo lang als zijn gewicht: SD 1 cm, AI 1 cm, ..., GD 6 cm. Dan prik je met je ogen dicht ergens op de lat. Waar je prikt, dat wordt het.

- `random()` geeft een getal van 0 tot 1 (bijv. 0,63). Maal het totaal (11) geeft de plek op de lat: 6,93 cm.
- De `for`-lus loopt de stukken langs en haalt telkens de lengte eraf. Wordt de rest kleiner dan 0, dan zat de prik in dit stuk.
- `random = Math.random` is een **standaardwaarde**: normaal gebruikt de functie `Math.random`, maar een test kan een eigen functie meegeven die altijd hetzelfde getal teruggeeft. Dan weet je zeker wat de uitkomst moet zijn. (`backend/game/devSimulation.js` doet precies hetzelfde.)

### 3.4 `selectQuestions`: het hele algoritme

- `bank.filter(...)` maakt een **nieuwe** lijst (de "pot"). We halen vragen uit de pot, maar `QUESTION_BANK` zelf blijft heel. Zou je de bank zelf leegmaken, dan heeft de volgende game geen vragen meer.
- `while (chosen.length < count && remaining.length > 0)`: herhaal tot we genoeg vragen hebben, **of** de pot leeg is. Vraagt de host meer vragen dan er zijn, dan krijgt hij er gewoon minder.
- Stap 1 kiest alleen uit vaardigheden waarvan nog vragen in de pot zitten. Anders zou je een vaardigheid kunnen kiezen zonder vragen.
- Stap 3: `distance` is hoe ver een vraag van het gewenste niveau af zit (`Math.abs` maakt het altijd positief). Zijn de 2 makkelijke GD-vragen al gebruikt, dan is "gemiddeld" (afstand 1) de beste keuze, en "moeilijk" (afstand 2) pas daarna.
- `remaining.splice(index, 1)` haalt precies één vraag uit de pot. Daardoor komt geen vraag twee keer (**criterium 5**).

---

## Stap 4: Tests voor de vragenbank en het algoritme

**Nieuw bestand:** `backend/tests/questionSelector.test.js`

```js
import { describe, expect, it } from "vitest";
import { QUESTION_BANK } from "../game/questionBank.js";
import {
  difficultyFor,
  pickWeighted,
  selectQuestions,
  skillWeight,
} from "../game/questionSelector.js";
import { SKILL_CODES } from "../../src/utils/skills.js";

// Een lobby waarin elke vaardigheid hetzelfde gemiddelde heeft, bijv. allSkills(5) = { SD: 5, AI: 5, ... }.
const allSkills = (average) =>
  Object.fromEntries(SKILL_CODES.map((code) => [code, average]));

describe("de vragenbank", () => {
  it("heeft per vaardigheid en per moeilijkheid minstens 2 vragen", () => {
    for (const skill of SKILL_CODES) {
      for (const difficulty of [1, 2, 3]) {
        const found = QUESTION_BANK.filter(
          (question) =>
            question.skill === skill && question.difficulty === difficulty,
        );
        expect(
          found.length,
          `${skill}, moeilijkheid ${difficulty}`,
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("heeft alleen bekende vaardigheden en precies één goed antwoord per vraag", () => {
    for (const question of QUESTION_BANK) {
      expect(SKILL_CODES, question.text).toContain(question.skill);
      expect(
        question.options.filter((option) => option.isCorrect),
        question.text,
      ).toHaveLength(1);
    }
  });
});

describe("questionSelector", () => {
  it("koppelt een gemiddelde aan een moeilijkheid", () => {
    expect(difficultyFor(0)).toBe(1);
    expect(difficultyFor(1.6)).toBe(1);
    expect(difficultyFor(1.7)).toBe(2);
    expect(difficultyFor(3.3)).toBe(2);
    expect(difficultyFor(3.4)).toBe(3);
    expect(difficultyFor(5)).toBe(3);
    expect(difficultyFor(null)).toBe(2); // niemand vulde iets in
  });

  it("geeft de zwakste vaardigheid het hoogste gewicht, maar nooit 0", () => {
    expect(skillWeight(0)).toBe(6);
    expect(skillWeight(5)).toBe(1);
    expect(skillWeight(null)).toBe(3.5);
  });

  it("kiest met pickWeighted naar verhouding van het gewicht", () => {
    const weights = { a: 1, b: 3 }; // samen 4: a is het stuk 0–1 van de lat, b het stuk 1–4
    const weightOf = (item) => weights[item];
    expect(pickWeighted(["a", "b"], weightOf, () => 0.2)).toBe("a"); // 0.2 × 4 = 0.8 → in het stuk van a
    expect(pickWeighted(["a", "b"], weightOf, () => 0.3)).toBe("b"); // 0.3 × 4 = 1.2 → in het stuk van b
  });

  it("kiest precies het gevraagde aantal vragen, zonder dubbele", () => {
    const chosen = selectQuestions(QUESTION_BANK, allSkills(2.5), 10);
    expect(chosen).toHaveLength(10);
    expect(new Set(chosen).size).toBe(10);
  });

  it("geeft nooit meer vragen dan er in de bank staan", () => {
    expect(
      selectQuestions(QUESTION_BANK.slice(0, 3), allSkills(2.5), 10),
    ).toHaveLength(3);
  });

  it("kiest de moeilijkheid die bij het gemiddelde past, en anders de dichtstbijzijnde", () => {
    const sdOnly = QUESTION_BANK.filter((question) => question.skill === "SD");

    // Beginners (0): eerst de 2 makkelijke SD-vragen, daarna is "gemiddeld" het dichtstbij.
    const beginners = selectQuestions(sdOnly, allSkills(0), 3);
    expect(beginners.map((question) => question.difficulty)).toEqual([1, 1, 2]);

    // Experts (5): de 2 moeilijke vragen.
    const experts = selectQuestions(sdOnly, allSkills(5), 2);
    expect(experts.map((question) => question.difficulty)).toEqual([3, 3]);
  });

  it("kiest vaker een vraag over de zwakste vaardigheid (1000 keer geprobeerd)", () => {
    const averages = { ...allSkills(5), GD: 0 }; // iedereen is goed in alles, behalve GD
    const counts = Object.fromEntries(SKILL_CODES.map((code) => [code, 0]));
    for (let i = 0; i < 1000; i++) {
      const [question] = selectQuestions(QUESTION_BANK, averages, 1);
      counts[question.skill] += 1;
    }
    // Gewichten: GD 6, de vijf andere elk 1. GD hoort dus ongeveer 6 van de 11 keer (± 545 keer) te komen.
    expect(counts.GD).toBeGreaterThan(450);
    for (const code of SKILL_CODES.filter((code) => code !== "GD")) {
      expect(counts[code]).toBeLessThan(counts.GD);
    }
  });
});
```

**Hoe lees je een test?**

- `it('...', () => { ... })`: één test, met een zin die zegt wat er moet kloppen.
- `expect(x).toBe(y)`: "ik verwacht dat x gelijk is aan y". Is dat niet zo, dan faalt de test.
- `expect(found.length, 'SD, moeilijkheid 1')`: de tekst als tweede waarde verschijnt in de foutmelding. Zo zie je meteen **welke** vaardigheid te weinig vragen heeft.
- `new Set(chosen).size`: een `Set` bewaart elk ding maar één keer. Is de grootte nog steeds 10, dan zaten er geen dubbele vragen in.
- De laatste test is de "1000 keer draaien en tellen" uit de chat. Omdat het toeval is, controleren we geen precies getal maar een ruime grens (meer dan 450 van de 1000). De kans dat GD toch minder dan 450 keer komt, is zo klein dat je die nooit zult zien.

Draai de tests:

```bash
npx vitest run backend/tests/questionSelector.test.js
```

Je moet zien: **9 passed**.

> **Rood?** Lees de foutmelding: er staat welke test faalt en wat er verwacht werd (`Expected`) tegenover wat er kwam (`Received`). Vergelijk je code nog eens precies met stap 2 en 3.

---

## Stap 5: `Game.js` het gemiddelde en de vragen laten kiezen

**Bestand:** `backend/game/Game.js`

Dit bestand beschrijft één lopende quiz: spelers, fase, vragen. Het weet niets van internet of browsers. Deze stap heeft **6 onderdelen** (5a t/m 5f).

### 5a. Imports

Zoek bovenaan (**regel 7**):

```js
import { QUIZ_QUESTIONS } from "./quizQuestions.js";
```

Zet **direct daaronder**:

```js
import { selectQuestions } from "./questionSelector.js";
import { SKILL_CODES } from "../../src/utils/skills.js";
import {
  DEFAULT_QUESTION_COUNT,
  QUESTION_COUNT_OPTIONS,
} from "../../src/utils/randomQuiz.js";
```

**Waarom `../../src/utils/`?** `..` betekent "één map omhoog". Vanuit `backend/game/` ga je twee keer omhoog naar de hoofdmap, en dan naar `src/utils/`. Bovenaan staat al een import die precies zo werkt: `../../src/utils/ranking.js`.

> **Let op:** dit bestand gebruikt **dubbele** aanhalingstekens en een `;` aan het eind. De nieuwe bestanden uit stap 2 en 3 gebruiken enkele aanhalingstekens zonder `;`, net als hun buren (`devSimulation.js`). JavaScript vindt allebei goed; houd per bestand de stijl aan die er al staat.

### 5b. Een nieuwe optie voor de constructor

Zoek (**regel 28**):

```js
    { questions = QUIZ_QUESTIONS, previewSeconds = 5, quizId = null, quizTitle = null, settings = {} } = {},
```

**Vervang die ene regel** door:

```js
    {
      questions = QUIZ_QUESTIONS,
      previewSeconds = 5,
      quizId = null,
      quizTitle = null,
      settings = {},
      questionBank = null,
    } = {},
```

Er is maar één ding bijgekomen: `questionBank = null`. De rest staat nu onder elkaar, zodat het leesbaar blijft. `null` betekent: "geen vragenbank", dus een gewone quiz uit de database. Zo blijven alle bestaande quizzen precies werken zoals nu.

### 5c. De vragenbank en het aantal vragen bewaren

Zoek in de constructor (**regel 36**):

```js
this.questions = questions;
```

**Vervang die regel** door:

```js
// Willekeurige quiz: geen vaste vragen, maar een vragenbank. Welke vragen het worden,
// kiest start() pas, want dan pas weet je wie er meedoen en welke vaardigheden ze hebben.
this.questionBank = questionBank;
this.questionCount = questionBank ? DEFAULT_QUESTION_COUNT : null;
this.questions = questionBank ? [] : questions;
```

**Uitleg:**

- `voorwaarde ? a : b`: als de voorwaarde waar is, neem `a`, anders `b`. Met een vragenbank begint het aantal op 10; zonder vragenbank is het `null` (niet van toepassing).
- Bij een willekeurige quiz zijn er in de lobby nog **geen** vragen (`[]`, een lege lijst). Ze worden pas bij de start gekozen (stap 5f).

### 5d. De host het aantal vragen laten kiezen

Zoek de functie `setLocked`. Die eindigt zo (**regel 133–134**):

```js
    this.locked = Boolean(locked);
  }
```

Zet **direct na die sluitende `}`** een lege regel en dan deze nieuwe functie:

```js

  /**
   * Willekeurige quiz: de host kiest in de lobby hoeveel vragen er komen.
   * Bij een quiz uit de database staan de vragen al vast, dus daar mag het niet.
   */
  setQuestionCount(count) {
    if (!this.questionBank) {
      throw new GameError(
        "NOT_RANDOM_QUIZ",
        "Het aantal vragen kies je alleen bij een willekeurige quiz.",
        409,
      );
    }
    if (this.phase !== PHASES.LOBBY) {
      throw new GameError(
        "WRONG_PHASE",
        "Het aantal vragen kan alleen in de lobby worden gekozen.",
        409,
      );
    }
    // Nooit blind overnemen wat een browser stuurt: alleen de vaste keuzes zijn goed.
    if (!QUESTION_COUNT_OPTIONS.includes(count)) {
      throw new GameError(
        "INVALID_QUESTION_COUNT",
        "Kies een geldig aantal vragen.",
        400,
      );
    }
    this.questionCount = count;
  }
```

**Uitleg:**

- Drie controles, elk met een `throw new GameError(code, melding, statuscode)`. Zo werken alle regels in dit bestand (kijk maar naar `setLocked` erboven). De **code** is voor programmeurs, de **melding** krijgt de host te zien, de **statuscode** zegt wat voor fout het is (409 = "kan nu niet", 400 = "foute invoer").
- `!this.questionBank`: het `!` betekent "niet". Dus: "als er **geen** vragenbank is".
- `QUESTION_COUNT_OPTIONS.includes(count)`: staat dit getal in `[5, 10, 15, 20]`? `includes` vergelijkt precies: de tekst `"5"` wordt geweigerd, alleen het getal `5` mag.

### 5e. Het gemiddelde per vaardigheid

Zet **direct onder** de functie uit 5d (dus na haar sluitende `}`) een lege regel en dan:

```js

  /**
   * Gemiddelde per vaardigheid van de spelers in de lobby, bijv. { SD: 3.5, AI: 1, ... }.
   * Bots tellen niet mee. null = niemand heeft deze vaardigheid ingevuld (zo deel je nooit door 0).
   * @returns {Record<string, number | null>}
   */
  getSkillAverages() {
    const players = [...this.players.values()].filter(
      (player) => !player.isBot,
    );
    return Object.fromEntries(
      SKILL_CODES.map((code) => {
        // Alleen spelers die deze vaardigheid echt hebben ingevuld, tellen mee.
        const values = players
          .map((player) => player.skills[code])
          .filter((value) => value !== undefined);
        if (values.length === 0) return [code, null];
        const total = values.reduce((sum, value) => sum + value, 0);
        return [code, total / values.length];
      }),
    );
  }
```

**Regel voor regel:**

- `this.players` is een **`Map`**: een lijst met paren "speler-id → speler". `[...this.players.values()]` maakt daar een gewone lijst met alleen de spelers van. (Dit patroon staat al in `addPlayer`.)
- `.filter((player) => !player.isBot)`: houd alleen spelers over die **geen** bot zijn. Bots zijn testspelers (zie `devSimulation.js`) en hebben geen echte vaardigheden.
- `SKILL_CODES.map((code) => ...)`: doe iets voor elke vaardigheid (`SD`, `AI`, ...). Per vaardigheid geven we een paar terug: `[code, gemiddelde]`.
- `.map((player) => player.skills[code])`: pak van elke speler zijn waarde voor deze vaardigheid. Heeft hij die niet ingevuld, dan is het `undefined`.
- `.filter((value) => value !== undefined)`: gooi de lege waarden weg. Nu bevat `values` alleen echte getallen.
- `if (values.length === 0) return [code, null]`: niemand vulde dit in, of de lobby is leeg. Dan geven we `null` terug in plaats van te delen door 0 (dat zou `NaN`, "geen getal", opleveren).
- `values.reduce((sum, value) => sum + value, 0)`: tel alles op. `reduce` begint bij `0` en telt er elke waarde bij op.
- `Object.fromEntries(...)`: maakt van de lijst met paren `[['SD', 2], ['AI', 5], ...]` een object `{ SD: 2, AI: 5, ... }`.

### 5f. De vragen kiezen bij de start

Zoek (**regel 164**):

```js
  start(now = Date.now()) {
```

Vervang door:

```js
  start(now = Date.now(), random = Math.random) {
```

Zoek in dezelfde functie (**regel 176**):

```js
if (this.settings.lockLobbyOnStart) this.locked = true;
```

Zet **direct daaronder**:

```js
// Willekeurige quiz: nu de spelers bekend zijn, kiest het algoritme de vragen.
// Na "Opnieuw spelen" gebeurt dit opnieuw, dus dan komen er (meestal) andere vragen.
if (this.questionBank) {
  this.questions = selectQuestions(
    this.questionBank,
    this.getSkillAverages(),
    this.questionCount,
    random,
  );
}
```

**Uitleg:**

- Dit staat **na** de controles bovenin `start()` (fase en minimaal 2 spelers). Mag de quiz niet starten, dan kiezen we ook geen vragen.
- `this.questions = ...` vervangt de lege lijst door de gekozen vragen. Alles wat daarna komt (de vraag-lus, de timer, de punten, het eindscherm) gebruikt `this.questions` al. Daar hoef je dus **niets** aan te veranderen.
- `random` geven we door aan het algoritme. Normaal is dat `Math.random`; een test kan een vaste functie meegeven.
- **Opnieuw spelen** (knop "Nog een ronde" op het podium): `restart()` zet de quiz terug naar de lobby. Bij de volgende `start()` kiest het algoritme opnieuw, met de vaardigheden van wie er dan in de lobby zit (**criterium 5**).

Sla op (`Ctrl+S`).

---

## Stap 6: Tests voor `Game.js`

**Bestand:** `backend/tests/Game.test.js`

### 6a. Imports

Zoek bovenaan (**regel 4**):

```js
import { QUIZ_QUESTIONS } from "../game/quizQuestions.js";
```

Zet **direct daaronder**:

```js
import { QUESTION_BANK } from "../game/questionBank.js";
import { DEFAULT_QUESTION_COUNT } from "../../src/utils/randomQuiz.js";
```

### 6b. De tests

Ga naar het **einde** van het bestand (`Ctrl+End`). Zet na de allerlaatste regel `})` een lege regel en dan:

```js
describe("Game: willekeurige quiz", () => {
  let game;
  const T0 = 1_000_000;

  beforeEach(() => {
    game = new Game("482913", { questionBank: QUESTION_BANK });
  });

  it("rekent het gemiddelde per vaardigheid uit, zonder bots", () => {
    // Lege lobby: nog niemand, dus null (en geen deling door 0).
    expect(game.getSkillAverages().SD).toBeNull();

    game.addPlayer("Emma", { skills: { SD: 0, AI: 5 } });
    game.addPlayer("Sam", { skills: { SD: 4 } });
    game.addPlayer("Testbot", { isBot: true, skills: { SD: 5 } });

    // SD: (0 + 4) / 2 = 2. AI: alleen Emma vulde het in. GD: niemand.
    expect(game.getSkillAverages()).toMatchObject({ SD: 2, AI: 5, GD: null });
  });

  it("laat de host het aantal vragen kiezen, alleen in de lobby", () => {
    expect(game.questionCount).toBe(DEFAULT_QUESTION_COUNT);
    expect(() => game.setQuestionCount(7)).toThrow(
      expect.objectContaining({ code: "INVALID_QUESTION_COUNT" }),
    );
    expect(() => game.setQuestionCount("5")).toThrow(
      expect.objectContaining({ code: "INVALID_QUESTION_COUNT" }),
    );

    game.setQuestionCount(5);
    game.addPlayer("Emma", { skills: { SD: 1 } });
    game.addPlayer("Sam", { skills: { SD: 3 } });
    game.start(T0);

    expect(game.totalQuestions).toBe(5);
    expect(
      game.questions.every((question) => QUESTION_BANK.includes(question)),
    ).toBe(true);
    expect(() => game.setQuestionCount(10)).toThrow(
      expect.objectContaining({ code: "WRONG_PHASE" }),
    );
  });

  it("stuurt de vaardigheid en moeilijkheid van een vraag niet naar de spelers", () => {
    game.addPlayer("Emma");
    game.addPlayer("Sam");
    game.start(T0);
    const payload = game.getQuestionPayload(T0);
    expect(payload).not.toHaveProperty("skill");
    expect(payload).not.toHaveProperty("difficulty");
  });

  it("weigert een aantal vragen bij een quiz uit de database", () => {
    const normal = new Game("111111", { questions: QUIZ_QUESTIONS });
    expect(normal.questionCount).toBeNull();
    expect(() => normal.setQuestionCount(5)).toThrow(
      expect.objectContaining({ code: "NOT_RANDOM_QUIZ" }),
    );
  });
});
```

**Uitleg:**

- `beforeEach` draait vóór **elke** test: elke test begint met een verse game. Zo hebben de tests geen last van elkaar.
- De eerste test is het "narekenen met nepdata" uit de chat: Emma 0 en Sam 4 op SD moet 2 geven, en de bot (5) telt niet mee.
- `toMatchObject` controleert alleen de velden die je noemt (SD, AI, GD). De andere vaardigheden mogen alles zijn.
- `T0` is een vast nep-"nu", zodat de test niet van de echte klok afhangt.

Sla op en draai alle tests:

```bash
npm test
```

Je moet zien: alles **passed**, en **13 tests meer** dan bij stap 2.4 (9 uit stap 4 en 4 uit deze stap).

**De regels zijn nu klaar.** Goed moment voor een pauze, of voor een tussentijdse commit (zie hoofdstuk 18).

---

## Stap 7: Een willekeurige quiz kunnen aanmaken (REST)

**Bestand:** `backend/routes/games.js`

Een game aanmaken gaat via REST (`POST /api/games`), omdat alleen een HTTP-antwoord de host-cookie kan zetten. Nu stuurt het beheerportaal daar `{ quizId }` heen. We voegen `{ random: true }` toe.

### 7a. Imports

Zoek bovenaan (**regel 4**):

```js
import { GameError } from "../game/GameError.js";
```

Zet **direct daaronder**:

```js
import { QUESTION_BANK } from "../game/questionBank.js";
import { RANDOM_QUIZ_TITLE } from "../../src/utils/randomQuiz.js";
```

### 7b. De route

Zoek (**regel 40**):

```js
router.post('/', requireRole('TEACHER', 'ADMIN'), async (request, response) => {
```

Zet **direct daaronder** (dus als eerste regels binnen de route, vóór `const quizId = ...`):

```js
// Willekeurige quiz: geen quiz uit de database, maar de vragenbank.
// Welke vragen het worden, kiest Game.start() pas als bekend is wie er meedoen.
if (request.body?.random === true) {
  const game = gameManager.createGame({
    questionBank: QUESTION_BANK,
    quizTitle: RANDOM_QUIZ_TITLE,
  });
  const token = gameManager.createSession({ code: game.code, role: "host" });
  setSessionCookie(response, HOST_COOKIE, token);
  return response.status(201).json({ gameCode: game.code });
}
```

**Uitleg:**

- `request.body?.random === true`: stuurt de browser `{ random: true }` mee? `?.` voorkomt een crash als er helemaal geen body is.
- `gameManager.createGame({...})` geeft de opties door aan `new Game(code, opties)`. Dus hier komt `questionBank` uit stap 5b vandaan.
- `quizTitle: RANDOM_QUIZ_TITLE`: spelers zien op het joinscherm de titel "Willekeurige quiz". Die titel komt ook in de uitslagen in de database.
- De drie regels daarna (sessie, cookie, antwoord) zijn **precies dezelfde** als onderaan de bestaande route. Kijk maar.
- `return`: stop hier, zodat de code voor een quiz uit de database niet ook nog draait.
- `requireRole('TEACHER', 'ADMIN')` staat al vóór de route: ook een willekeurige quiz mag alleen een docent of beheerder hosten. (Wil het team dat iedereen mag hosten, zie hoofdstuk 20.)

### 7c. Een test voor de route

**Bestand:** `backend/tests/api/quizzes.test.js`

Ga naar het **einde** van het bestand en zet na de laatste regel een lege regel en dan:

```js
describe("willekeurige quiz hosten", () => {
  it("een docent start een willekeurige quiz zonder quizId", async () => {
    const { agent } = await loggedIn({ role: "TEACHER" });
    const response = await agent.post("/api/games").send({ random: true });
    expect(response.status).toBe(201);

    const game = gameManager.getGame(response.body.gameCode);
    expect(game.quizTitle).toBe("Willekeurige quiz");
    expect(game.questionCount).toBe(10);
    // De vragen worden pas bij de start gekozen, als bekend is wie er meedoen.
    expect(game.questions).toEqual([]);
  });

  it("een student mag ook geen willekeurige quiz hosten", async () => {
    const { agent } = await loggedIn({ role: "STUDENT" });
    expect((await agent.post("/api/games").send({ random: true })).status).toBe(
      403,
    );
  });
});
```

`loggedIn` en `gameManager` staan al bovenaan dit bestand. Deze tests draaien met `npm run test:api` (Docker moet aan staan; ze gebruiken een aparte testdatabase `quiz_test`, dus je eigen data blijft heel). Dat doen we in hoofdstuk 17.

Sla beide bestanden op.

---

## Stap 8: De naam van het nieuwe event vastleggen

Alle eventnamen staan in één lijst. Een typfout in een tekst (`'host:set-question-cout'`) geeft geen foutmelding; het bericht komt dan gewoon nooit aan. Met een vaste naam (`EVENTS.HOST_SET_QUESTION_COUNT`) zie je een typfout wel meteen.

### 8a. Backend

**Bestand:** `backend/socket/events.js`

Zoek (**regel 14**):

```js
  HOST_LOCK: "host:lock", // alleen in de lobby: { locked } = nieuwe spelers weigeren of weer toelaten
```

Zet **direct daaronder**:

```js
  HOST_SET_QUESTION_COUNT: "host:set-question-count", // alleen in de lobby van een willekeurige quiz: { count }
```

### 8b. Frontend (de kopie)

**Bestand:** `src/socket/events.js`

Zoek (**regel 11**):

```js
  HOST_LOCK: "host:lock", // alleen in de lobby
```

Zet **direct daaronder**:

```js
  HOST_SET_QUESTION_COUNT: "host:set-question-count", // alleen in de lobby van een willekeurige quiz
```

> Heb je de tijdslimiet-handleiding al gedaan? Dan staat daar ook `HOST_SET_TIME_LIMIT`. Laat die staan; de volgorde maakt niet uit.

Sla beide bestanden op.

---

## Stap 9: De server laten luisteren naar de host

**Bestand:** `backend/socket/hostHandlers.js`

Hier staan alle berichten die **alleen de host** mag sturen. Een speler kan dit event niet misbruiken: de server luistert er bij spelers niet eens naar.

Zoek het einde van het blok voor `HOST_LOCK` (**regel 100–108**):

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
// Willekeurige quiz: aantal vragen kiezen. Game.setQuestionCount controleert of het mag;
// lobby:update vertelt daarna iedereen (host én spelers) het nieuwe aantal.
socket.on(EVENTS.HOST_SET_QUESTION_COUNT, ({ count } = {}, ack) => {
  try {
    game.setQuestionCount(count);
    sendLobbyUpdate(io, game);
    ack?.({ ok: true, questionCount: game.questionCount });
  } catch (error) {
    ack?.(toErrorResponse(error));
  }
});
```

> Let op: dit moet **binnen** de functie `registerHostHandlers` staan, dus vóór de `}` die die functie afsluit (en vóór de functie `toErrorResponse`).

**Uitleg:**

- `socket.on(naam, (payload, ack) => {...})`: "als dit bericht binnenkomt, doe dan dit".
- `({ count } = {})`: haal `count` uit het bericht. Stuurt de browser niets mee, dan is `count` `undefined` en weigert `setQuestionCount` het netjes (`INVALID_QUESTION_COUNT`).
- `try { ... } catch (error) { ... }`: gaat het mis, dan sturen we de fout terug in plaats van dat de server crasht.
- Dit blok lijkt bewust bijna precies op `HOST_LOCK` erboven. Zo werkt elke host-actie in deze app.

Je hoeft niets te importeren: `EVENTS`, `sendLobbyUpdate` en `toErrorResponse` staan al in dit bestand.

Sla op.

---

## Stap 10: Aantal vragen en gemiddelden meesturen naar alle schermen

### 10a. Bij elke lobby-update

**Bestand:** `backend/socket/broadcast.js`

Zoek in de functie `sendLobbyUpdate` (**regel 13**):

```js
    locked: game.locked,
  })
```

Maak ervan:

```js
    locked: game.locked,
    questionCount: game.questionCount,
    skillAverages: game.getSkillAverages(),
  })
```

**Waarom werkt dit vanzelf als er iemand joint?** De join-route (`POST /:code/players` in `routes/games.js`) roept na `addPlayer` al `sendLobbyUpdate` aan. Vertrekt of verdwijnt er iemand, dan ook. De host ziet de balkjes dus meteen veranderen als er een speler bij komt.

### 10b. Na verversen van de pagina

**Bestand:** `backend/socket/syncState.js`

Als iemand de pagina ververst, vraagt de browser de hele toestand opnieuw op (`game:sync`). Die moet dezelfde lobby-gegevens bevatten als `lobby:update`, anders zijn het aantal en de balkjes na verversen "weg".

Zoek (**regel 16**):

```js
    lobby: { players, playerCount: players.length, locked: game.locked },
```

Vervang door:

```js
    lobby: {
      players,
      playerCount: players.length,
      locked: game.locked,
      questionCount: game.questionCount,
      skillAverages: game.getSkillAverages(),
    },
```

> Heb je de tijdslimiet-handleiding al gedaan? Dan staat er in beide bestanden ook `timeLimitSec: game.timeLimitSec`. Laat die regel staan en zet de twee nieuwe regels erbij.

Sla beide bestanden op.

**De server is nu klaar.** Docker herstart de server vanzelf als je een bestand opslaat (dat doet _nodemon_). Draai voor de zekerheid `npm test`: alles moet groen zijn.

---

## Stap 11: De keuzeknoppen maken (nieuw component)

Nu de schermen. Eerst een losse bouwsteen: een rij knoppen voor het aantal vragen. Zo blijft de (al lange) lobby-pagina overzichtelijk.

### 11a. Het component

**Nieuw bestand:** `src/components/QuestionCountPicker.jsx`

```jsx
import { QUESTION_COUNT_OPTIONS } from "../utils/randomQuiz.js";
import "./QuestionCountPicker.css";

/**
 * Knoppen om in de lobby van een willekeurige quiz het aantal vragen te kiezen.
 * Net als LockButton onthoudt dit onderdeel zelf niets: `value` komt van de server (lobby:update),
 * zodat de knoppen na verversen of in een tweede tabblad hetzelfde laten zien als de server.
 * @param {{ value: number, onChange: (count: number) => void, disabled?: boolean }} props
 */
export default function QuestionCountPicker({
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div
      className="count-picker"
      role="group"
      aria-labelledby="count-picker-label"
    >
      <p id="count-picker-label" className="count-picker__label">
        Aantal vragen
      </p>
      <div className="count-picker__choices">
        {QUESTION_COUNT_OPTIONS.map((count) => {
          const selected = count === value;
          return (
            <button
              key={count}
              type="button"
              className={
                selected
                  ? "count-picker__choice count-picker__choice--selected"
                  : "count-picker__choice"
              }
              // aria-pressed vertelt een schermlezer welke knop nu "aan" staat.
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(count)}
            >
              {count}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Uitleg:**

- De keuzes komen uit `src/utils/randomQuiz.js` (stap 1): **dezelfde** lijst die de server gebruikt om te controleren. Er is dus geen tweede lijst om bij te houden.
- Een component krijgt **props** mee: `value` (welk aantal nu gekozen is), `onChange` (wat er moet gebeuren bij een klik) en `disabled` (knoppen even uitzetten).
- `QUESTION_COUNT_OPTIONS.map(...)` maakt voor elk aantal een `<button>`. React wil bij zo'n lijst een unieke `key` per item; het getal zelf is uniek.
- `role="group"` en `aria-pressed` zijn voor toegankelijkheid: een schermlezer zegt dan "Aantal vragen, 10, ingedrukt".

### 11b. De opmaak

**Nieuw bestand:** `src/components/QuestionCountPicker.css`

```css
/* Keuzeknoppen "Aantal vragen" in de lobby van een willekeurige quiz. Kleuren komen uit src/index.css (--quiz-*). */
.count-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.count-picker__label {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.count-picker__choices {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.count-picker__choice {
  min-width: 64px;
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

.count-picker__choice:hover:not(:disabled) {
  border-color: var(--quiz-primary);
}

.count-picker__choice:focus-visible {
  outline: 3px solid var(--quiz-text);
  outline-offset: 3px;
}

/* Het gekozen aantal: gevuld met de hoofdkleur, zodat je in één oogopslag ziet wat er aan staat. */
.count-picker__choice--selected {
  border-color: var(--quiz-primary);
  background: var(--quiz-primary);
  color: #ffffff;
}

.count-picker__choice:disabled {
  cursor: wait;
  opacity: 0.7;
}
```

**Waarom `var(--quiz-primary)` en geen kleurcode?** Afspraak in dit project: alle kleuren staan één keer in `src/index.css`. Verandert het team de huiskleur, dan verandert jouw knop automatisch mee.

Sla beide bestanden op.

---

## Stap 12: De knop "Willekeurige quiz hosten" in het beheerportaal

### 12a. De knoppen maken

**Bestand:** `src/pages/Admin/OverviewPage.jsx`

Bovenin staat al de functie `NewQuizButton` (de knop "Nieuwe quiz"). Zoek de regel direct daaronder (**regel 23**):

```jsx
/** /admin: overzicht voor docent en beheerder (story 7), design "7 · Admin — overzicht & quizzen". */
```

Zet **direct erboven** (dus tussen `NewQuizButton` en deze regel):

```jsx
/** Willekeurige quiz hosten: vragen uit de vragenbank, gekozen op de vaardigheden van de spelers. */
export function RandomQuizButton() {
  return (
    <Link to="/host/new?random=1" className="ui-btn">
      Willekeurige quiz hosten
    </Link>
  );
}

/** De knoppen rechts naast de titel: willekeurige quiz hosten en een nieuwe quiz maken. */
export function QuizActions() {
  return (
    <div className="admin-page__actions">
      <RandomQuizButton />
      <NewQuizButton />
    </div>
  );
}
```

Zoek daarna in dezelfde file (**regel 59**, na je toevoeging een stuk lager):

```jsx
      action={<NewQuizButton />}
```

Vervang door:

```jsx
      action={<QuizActions />}
```

**Uitleg:**

- `<Link to="...">` is een link binnen de app (van react-router): de pagina laadt niet opnieuw. `Link` is bovenaan dit bestand al geïmporteerd.
- `className="ui-btn"` is de gewone knopstijl (wit met rand). "Nieuwe quiz" heeft `ui-btn--primary` (gevuld); zo blijft "Nieuwe quiz" de hoofdknop.
- `/host/new?random=1`: het stukje na het `?` heet een _query parameter_. In stap 13a lezen we hem uit.
- `AdminLayout` heeft één plek voor een knop (`action`). Daarom zetten we de twee knoppen samen in één `<div>`.

### 12b. Dezelfde knoppen op de pagina "Quizzen"

**Bestand:** `src/pages/Admin/QuizzesPage.jsx`

Zoek (**regel 8**):

```jsx
import { NewQuizButton } from "./OverviewPage.jsx";
```

Vervang door:

```jsx
import { QuizActions } from "./OverviewPage.jsx";
```

Zoek (**regel 42**) in de regel met `<AdminLayout`:

```jsx
action={<NewQuizButton />}
```

en vervang **alleen dat stukje** door:

```jsx
action={<QuizActions />}
```

### 12c. De knoppen naast elkaar zetten

**Bestand:** `src/pages/Admin/Admin.css`

Zet **helemaal onderaan** het bestand:

```css
/* Twee knoppen rechts naast de titel (Willekeurige quiz hosten, Nieuwe quiz). */
.admin-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
```

`flex-wrap: wrap` zorgt dat de knoppen op een telefoon onder elkaar komen als ze niet naast elkaar passen.

Sla alle drie de bestanden op.

---

## Stap 13: Aanmaken en de lobby van de host

**Bestand:** `src/pages/HostGamePage/HostGamePage.jsx`

Dit bestand bevat twee schermen: `HostCreatePage` (maakt de game aan, je ziet even "Lobby wordt aangemaakt…") en `HostGamePage` (het grote scherm). Deze stap heeft **6 onderdelen**.

### 13a. Imports

Zoek bovenaan (**regel 4**):

```jsx
import LockButton from "../../components/LockButton.jsx";
```

**Vervang die regel** door deze drie:

```jsx
import { SkillBars } from "../../components/AccountUi.jsx";
import LockButton from "../../components/LockButton.jsx";
import QuestionCountPicker from "../../components/QuestionCountPicker.jsx";
```

`SkillBars` bestaat al: het zijn de balkjes van "Mijn account". We hergebruiken ze, in plaats van zelf nieuwe balkjes te bouwen.

### 13b. `HostCreatePage` ook een willekeurige quiz laten maken

Zoek in `HostCreatePage` (**regel 34**):

```jsx
const quizId = Number(params.get("quiz"));
```

Zet **direct daaronder**:

```jsx
const random = params.get("random") === "1";
```

Zoek iets lager (**regel 42–46**):

```jsx
if (!quizId) {
  setError("Kies eerst een quiz in het beheerportaal.");
  return;
}
api("/games", { method: "POST", body: { quizId } });
```

Vervang die 5 regels door:

```jsx
if (!quizId && !random) {
  setError("Kies eerst een quiz in het beheerportaal.");
  return;
}
const body = random ? { random: true } : { quizId };
api("/games", { method: "POST", body });
```

En zoek (**regel 49**):

```jsx
  }, [navigate, quizId]);
```

Vervang door:

```jsx
  }, [navigate, quizId, random]);
```

**Uitleg:**

- `params.get("random")` leest `?random=1` uit de adresbalk. Het is altijd tekst, dus we vergelijken met `"1"` (tussen aanhalingstekens).
- `!quizId && !random`: alleen een foutmelding als er **geen** quiz **en** geen willekeurige quiz gekozen is.
- De lijst `[navigate, quizId, random]` aan het eind van `useEffect` vertelt React welke waarden het effect gebruikt. Gebruik je een nieuwe waarde in het effect, dan hoort hij in die lijst.

### 13c. Een functie die het aantal naar de server stuurt

Zoek in `HostGamePage` (**regel 156**):

```jsx
// Eén actie voor "Antwoorden nu tonen", "Tijd stoppen" en "Volgende vraag" (zie Game.next op de server).
```

Zet **direct erboven** (dus tussen de functie `toggleLock` en dit commentaar):

```jsx
// Willekeurige quiz: aantal vragen kiezen. Net als bij het slot wachten we op lobby:update:
// zo laat het scherm altijd het aantal zien dat de server echt gebruikt.
async function changeQuestionCount(count) {
  setBusy(true);
  setError(null);
  const response = await emitWithAck(EVENTS.HOST_SET_QUESTION_COUNT, {
    count,
  }).catch(() => null);
  if (!response?.ok)
    setError(response?.message ?? "Geen antwoord van de server.");
  setBusy(false);
}
```

**Uitleg:**

- Vergelijk deze functie met `toggleLock` erboven: ze lijken bewust bijna precies op elkaar.
- `setBusy(true)`: zet de knoppen even uit, zodat de host niet vijf keer snel kan klikken.
- `emitWithAck(...)`: stuur het event naar de server en **wacht** (`await`) op het antwoord.
- We zetten de knop hier **niet** zelf op oranje. Dat gebeurt pas als de server `lobby:update` stuurt (daar luistert de pagina al naar, rond regel 101). Zo laat het scherm nooit iets anders zien dan de server gebruikt.

### 13d. Het aantal en de gemiddelden uit de lobby-gegevens halen

Zoek (**regel 272**, na 13c een stuk lager):

```jsx
const { players, playerCount, locked } = game.lobby;
```

Vervang door:

```jsx
const { players, playerCount, locked, questionCount, skillAverages } =
  game.lobby;
```

> Heb je de tijdslimiet-handleiding al gedaan? Dan staat hier ook `timeLimitSec`. Laat die staan en zet `questionCount, skillAverages` erachter.

### 13e. Het blok "Willekeurige quiz" op het scherm zetten

Zoek (**regel 294**):

```jsx
<LockButton locked={locked} onToggle={toggleLock} disabled={busy} />
```

Zet **direct daaronder**:

```jsx
{
  /* Alleen bij een willekeurige quiz: bij een quiz uit de database is questionCount null. */
}
{
  questionCount != null && (
    <section
      className="host-game__random"
      aria-labelledby="host-game-random-title"
    >
      <h2 id="host-game-random-title" className="host-game__random-title">
        Willekeurige quiz
      </h2>
      <QuestionCountPicker
        value={questionCount}
        onChange={changeQuestionCount}
        disabled={busy}
      />
      <p className="host-game__random-hint">
        Gemiddelde vaardigheden van deze lobby. Bij de start komen er meer
        vragen over de zwakste vaardigheden, op een niveau dat bij jullie past.
      </p>
      <SkillBars skills={roundAverages(skillAverages)} />
    </section>
  );
}
```

**Uitleg:**

- `{voorwaarde && (...)}`: React tekent het blok alleen als de voorwaarde waar is.
- `questionCount != null`: met **één** `=` na het `!` vangt dit zowel `null` als `undefined`. Bij een quiz uit de database is `questionCount` `null`, dus dan zie je dit blok niet.
- `<SkillBars skills={...} />` tekent per vaardigheid een balkje, bijv. "SD ████░░ 3.5/5".

### 13f. Een hulpfunctie om af te ronden

De server stuurt gemiddelden zoals `2.3333333`. Dat past niet mooi op het scherm.

Ga naar het **einde** van het bestand (`Ctrl+End`). Zet na de allerlaatste `}` een lege regel en dan:

```jsx
// De server stuurt bijv. 2.3333…; op het scherm is één decimaal genoeg.
// null (nog niemand heeft deze vaardigheid ingevuld) tonen we als 0.
function roundAverages(averages = {}) {
  return Object.fromEntries(
    Object.entries(averages).map(([code, value]) => [
      code,
      Math.round((value ?? 0) * 10) / 10,
    ]),
  );
}
```

**Uitleg:** `Math.round` rondt af op hele getallen. De truc `× 10`, afronden, `÷ 10` rondt af op één decimaal: 2,333 × 10 = 23,33 → 23 → 2,3. `Object.entries` maakt van een object een lijst met paren, `Object.fromEntries` maakt er weer een object van (dat zag je ook in stap 5e).

Sla op.

### 13g. De opmaak van het blok

**Bestand:** `src/pages/HostGamePage/HostGamePage.css`

Zet **helemaal onderaan**:

```css
/* Willekeurige quiz: aantal vragen kiezen en de vaardigheden van de lobby. */
.host-game__random {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: min(100%, 520px);
  margin-top: 8px;
  padding: 20px 24px;
  border: 2px solid var(--quiz-border);
  border-radius: 16px;
  background: var(--quiz-surface);
}

.host-game__random-title {
  margin: 0;
  font-size: 22px;
}

.host-game__random-hint {
  margin: 0;
  font-size: 16px;
  text-align: center;
}

/* De balkjes komen uit AccountUi (SkillBars). Hier over de volle breedte,
   en de laatste kolom iets breder, want een gemiddelde als "3.3/5" is langer dan "3/5". */
.host-game__random .ui-skills {
  width: 100%;
}

.host-game__random .ui-skill {
  grid-template-columns: 44px minmax(0, 1fr) 52px;
}
```

`width: min(100%, 520px)`: het blok is nooit breder dan 520 pixels, maar op een smal scherm (telefoon) past het zich aan.

Sla op.

---

## Stap 14: Spelers laten zien hoeveel vragen er komen

**Bestand:** `src/pages/PlayerGamePage/PlayerGamePage.jsx`

Zoek (**regel 247–250**):

```jsx
<p>
  {game.lobby.playerCount} {game.lobby.playerCount === 1 ? "speler" : "spelers"}{" "}
  in de lobby
</p>
```

Zet **direct na die `</p>`**:

```jsx
{
  game.lobby.questionCount != null && (
    <p>
      Willekeurige quiz: <strong>{game.lobby.questionCount} vragen</strong>,
      gekozen op de vaardigheden van deze lobby.
    </p>
  );
}
```

> Heb je de tijdslimiet-handleiding al gedaan? Dan staat daar al een `<p>` met "Tijd per vraag". Zet dit blok eronder.

Sla op. De speler-pagina luistert al naar `lobby:update` en `game:sync`, dus de tekst verandert vanzelf als de host een ander aantal kiest.

---

## Stap 15: De documentatie bijwerken

**Bestand:** `docs/SOCKET-EVENTS.md`

Afspraak in dit team: verander je een event of endpoint, dan pas je ook dit document aan, in dezelfde PR.

### 15a. `POST /api/games`

Zoek in de eerste tabel de regel die begint met ``| `POST /api/games` |``. Verander de tweede kolom van:

```md
`{ quizId }`
```

in:

```md
`{ quizId }` of `{ random: true }`
```

### 15b. Het nieuwe event in de tabel "Client → server"

Zoek de regel die begint met ``| `host:lock` | host |``. Zet **daaronder** een nieuwe regel:

```md
| `host:set-question-count` | host | `{ count: 5 \| 10 \| 15 \| 20 }` | `{ ok, questionCount }`; alleen bij een willekeurige quiz (anders `NOT_RANDOM_QUIZ`) en alleen in `LOBBY` (anders `WRONG_PHASE`). Andere waarden: `INVALID_QUESTION_COUNT`. Bij `host:start` kiest de server zoveel vragen uit de vragenbank (`backend/game/questionSelector.js`). Iedereen krijgt `lobby:update` met de nieuwe `questionCount` |
```

(`\|` is een `|` die niet als kolomscheiding telt.)

### 15c. `lobby:update` en `game:sync`

Zoek in de tabel "Server → client" de regel van `lobby:update` en verander:

```md
`{ players: [{ id, nickname, connected, isVerified }], playerCount, locked }`
```

in:

```md
`{ players: [{ id, nickname, connected, isVerified }], playerCount, locked, questionCount, skillAverages }`; `questionCount` is `null` bij een quiz uit de database, `skillAverages` is `{ SD: 3.5, AI: null, ... }` (gemiddelde per vaardigheid zonder bots, `null` = niemand vulde hem in)
```

Doe hetzelfde in het blok `### state van game:sync`, bij de regel die begint met `lobby:`:

```js
  lobby: { players: [{ id, nickname, connected, isVerified }], playerCount, locked, questionCount, skillAverages },
```

Sla op.

---

## 16. Even samenvatten wat je gebouwd hebt

```
src/utils/randomQuiz.js          ← keuzes (5/10/15/20), gedeeld door browser en server
backend/game/questionBank.js     ← 36 vragen met skill + difficulty
backend/game/questionSelector.js ← het algoritme (puur, getest)
backend/game/Game.js             ← getSkillAverages(), setQuestionCount(), vragen kiezen in start()
routes/games.js                  ← POST /api/games { random: true }
hostHandlers.js + events.js      ← host:set-question-count
broadcast.js + syncState.js      ← questionCount + skillAverages naar iedereen
QuestionCountPicker + HostGamePage + PlayerGamePage + OverviewPage ← de schermen
```

---

## 17. Testen

### 17.1 Automatische tests

```bash
npm test
```

Alles moet **passed** zijn. Heb je Docker draaien, doe dan ook deze twee (ze testen de hele app, inclusief database en een volledige quiz):

```bash
npm run test:api
npm run test:smoke
```

### 17.2 Zelf uitproberen in de browser

Je hebt **twee spelers** nodig om te kunnen starten. Gebruik twee andere browservensters, bijvoorbeeld een **incognitovenster** (`Ctrl+Shift+N` in Chrome) en een andere browser (Edge of Firefox). Elk venster is een andere speler.

1. **Host:** ga naar http://localhost:5173/inloggen en log in als docent: `docent@hu.nl` / `Docent123`.
2. Je komt in het beheerportaal. **Controleer:** rechts naast de titel staan **Willekeurige quiz hosten** en **Nieuwe quiz**. ✅ _criterium 1_
3. Klik **Willekeurige quiz hosten**. Je ziet de lobby met de code.
4. **Controleer:** onder de slot-knop staat het blok **Willekeurige quiz**; de knop **10** is oranje en alle balkjes staan op 0.
5. **Speler 1:** ga in het incognitovenster naar http://localhost:5173/join, vul de code in en de naam `Test1`. Zet de sliders: **GD op 0**, alle andere op **5**. Klik Join.
6. **Controleer bij de host:** de balkjes veranderen meteen: GD 0/5, de rest 5/5. ✅ _criterium 3_
7. **Speler 2:** in de andere browser hetzelfde met naam `Test2`, ook **GD op 0** en de rest op **5**.
8. **Controleer bij de spelers:** "Willekeurige quiz: **10 vragen**, gekozen op de vaardigheden van deze lobby."
9. **Host:** klik **5**.
   - De knop **5** wordt oranje. ✅ _criterium 2_
   - Bij beide spelers staat meteen "**5 vragen**" (zonder verversen).
10. Druk bij de host op **F5** (verversen). De knop **5** moet nog oranje zijn en de balkjes moeten blijven staan. (Werkt dit niet? Dan mist stap 10b.)
11. **Host:** klik **Quiz starten** en speel de vragen.
    - Er komen precies **5** vragen.
    - De meeste gaan over **game development**, en dan de **makkelijke** (FPS, sprite), want GD is 0 in deze lobby. Vragen over andere vaardigheden zijn juist **moeilijk** (bijv. "0xFF", "ReLU", "GROUP BY"), want daar is de lobby 5. ✅ _criterium 4_
    - Geen vraag komt twee keer. ✅ _criterium 5_
12. Klik op het podium op **Nog een ronde** en start opnieuw: je krijgt (meestal) andere vragen.
13. **Gewone quiz:** ga terug naar `/admin` en host een quiz uit de lijst. Het blok "Willekeurige quiz" mag daar **niet** staan, en de quiz speelt zijn eigen vragen zoals altijd.

> Het is toeval: bij 5 vragen kan het een keer gebeuren dat er maar 2 over GD gaan. Speel een paar keer, of kies 20 vragen: dan zie je duidelijk dat GD het vaakst komt.

### 17.3 Controleren dat de server foute invoer weigert

De knoppen sturen alleen goede waarden, maar iemand kan ook zelf berichten sturen. Probeer dat:

1. Maak een nieuwe willekeurige lobby en open bij de host **DevTools** met `F12` → tabblad **Console**.
2. Plak dit en druk Enter:

   ```js
   const { socket } = await import("/src/socket/socket.js");
   socket.emit("host:set-question-count", { count: 7 }, console.log);
   ```

3. Je moet zien: `{ ok: false, error: 'INVALID_QUESTION_COUNT', message: 'Kies een geldig aantal vragen.' }`.
4. Doe hetzelfde in de lobby van een **gewone** quiz met `{ count: 5 }`: nu moet je `NOT_RANDOM_QUIZ` zien.
5. Start de willekeurige quiz en probeer `{ count: 5 }` opnieuw: nu `WRONG_PHASE`, na de start mag het niet meer.

---

## 18. Je werk opslaan en delen (commit en pull request)

Kijk eerst wat je veranderd hebt:

```bash
git status
```

Je moet 16 gewijzigde bestanden en 6 nieuwe bestanden zien (`randomQuiz.js`, `questionBank.js`, `questionSelector.js`, `questionSelector.test.js`, `QuestionCountPicker.jsx`, `QuestionCountPicker.css`).

Voeg alles toe en maak een commit. In dit team gebruiken commit-berichten het formaat `feat:` (nieuwe functie), `fix:` (reparatie), enzovoort:

```bash
git add backend src docs
git commit -m "feat: willekeurige quiz met vragen op basis van de vaardigheden in de lobby"
git push -u origin feature_WillekeurigeQuiz
```

Open daarna GitHub. Je ziet een gele balk met **Compare & pull request**. Klik erop en let op:

- **base:** `dev` (niet `main`!)
- **compare:** `feature_WillekeurigeQuiz`
- Zet in de beschrijving de user story en hoe je getest hebt (hoofdstuk 17).

---

## 19. Problemen oplossen

| Wat zie je?                                                                                       | Waarschijnlijke oorzaak                                                | Oplossing                                                                                              |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm test`: `Failed to resolve import "../game/questionSelector.js"`                              | Bestandsnaam anders gespeld of in de verkeerde map                     | Het moet precies `backend/game/questionSelector.js` zijn (hoofdletters tellen mee)                     |
| Test "de vragenbank": `SD, moeilijkheid 2: expected 1 to be greater than or equal to 2`           | Een vraag weggehaald of een verkeerde moeilijkheid gegeven             | Zorg voor minstens 2 vragen per vaardigheid per moeilijkheid                                           |
| Test "de vragenbank": `expected [...] to include 'Sd'`                                            | Een code anders gespeld                                                | Gebruik precies de codes uit `src/utils/skills.js`, in hoofdletters                                    |
| `npm test`: `SKILL_CODES is not defined` of `selectQuestions is not defined`                      | Stap 5a vergeten                                                       | Voeg de imports bovenaan `Game.js` toe                                                                 |
| `npm test`: `game.setQuestionCount is not a function`                                             | Stap 5d staat niet in de klasse `Game`, of is niet opgeslagen          | Controleer dat de functie tussen `setLocked` en `setConnected` staat; `Ctrl+S`                         |
| Gemiddelde is `NaN`                                                                               | Er wordt gedeeld door 0, of een waarde is geen getal                   | Vergelijk stap 5e: de regel `if (values.length === 0) return [code, null];` moet erin staan            |
| De quiz start, maar zonder vragen (meteen het podium of een fout)                                 | Stap 5f vergeten                                                       | `start()` moet `selectQuestions(...)` aanroepen als er een vragenbank is                               |
| Knop "Willekeurige quiz hosten" werkt, maar je krijgt "Kies eerst een quiz in het beheerportaal." | Stap 13b niet (helemaal) gedaan                                        | Controleer `const random = ...` en `if (!quizId && !random)`                                           |
| Fout "Kies eerst een quiz om te hosten." (`QUIZ_REQUIRED`)                                        | Stap 7b vergeten of staat ná `const quizId`                            | Het `if (request.body?.random === true)`-blok moet als eerste in de route staan                        |
| Het blok "Willekeurige quiz" verschijnt niet                                                      | Stap 10a of 13d/13e vergeten                                           | Controleer `broadcast.js` en `HostGamePage.jsx`. Kijk in de console (`F12`) naar fouten                |
| Je klikt een aantal, maar de knop wordt niet oranje en er komt geen melding                       | Stap 8b vergeten (de frontend kent het event niet) of stap 9 ontbreekt | Controleer beide `events.js`-bestanden en `hostHandlers.js`. Kijk ook in `docker compose logs backend` |
| Knop wordt oranje, maar na F5 weer 10 / balkjes leeg                                              | Stap 10b vergeten                                                      | Voeg `questionCount` en `skillAverages` toe in `syncState.js`                                          |
| Witte pagina, console: `roundAverages is not defined`                                             | Stap 13f vergeten                                                      | Zet de functie onderaan `HostGamePage.jsx`                                                             |
| Melding "Geen antwoord van de server."                                                            | De server draait niet of is gecrasht                                   | `docker compose logs backend` laat de fout zien. Vaak een typfout (vergeten `}` of `,`)                |
| `npm run test:api`: `Failed to load url nodemailer`                                               | De hulpprogramma's op je laptop zijn niet bijgewerkt                   | Draai `npm install` en probeer opnieuw                                                                 |
| `git push` geeft een fout over "upstream"                                                         | De branch bestaat nog niet op GitHub                                   | Gebruik precies `git push -u origin feature_WillekeurigeQuiz`                                          |

Kom je er niet uit? Kijk met `git diff` naar al je wijzigingen en vergelijk ze regel voor regel met deze handleiding.

---

## 20. Later (niet in deze story)

Dingen die uit de chat of de teambeschrijving kwamen, maar bewust **niet** in deze handleiding zitten:

- **Iedereen mag hosten.** Nu mag alleen een docent of beheerder hosten (`requireRole('TEACHER', 'ADMIN')` in `routes/games.js` en `<RequireAuth roles={STAFF}>` bij `/host/new` in `src/App.jsx`). Het team wil later een startpagina met "Meedoen" en "Hosten" voor iedereen; in `src/App.jsx` staat daar al een `TODO` voor. Dat is een aparte story, want het verandert wie wat mag.
- **De joinpagina laten werken met de gedeelde lijst.** `src/pages/JoinPage/JoinPage.jsx` heeft nog een eigen `skillDefinitions` met dezelfde codes en kleuren als `SKILLS` in `src/utils/skills.js`. Die kun je vervangen door een import, zodat er echt maar één lijst is.
- **Vaardigheid tonen bij de vraag.** Bijv. een gekleurd labeltje "GD" op het vraagscherm. Dan moet `getQuestionPayload` ook `skill` meesturen (nooit `isCorrect`!).
- **Moeilijker na een goede ronde.** Het projectplan (hoofdstuk 13.2) stelt voor: was de vorige ronde meer dan 80 % goed, dan bij "Opnieuw spelen" één niveau omhoog.
- **Sterke in plaats van zwakke vaardigheden.** Wil het team dat? Verander in `skillWeight` de formule in `average + 1` en pas de test aan. Je kunt er ook een keuze voor de host van maken, op dezelfde manier als het aantal vragen.
- **Meer vragen.** Hoe groter de vragenbank, hoe minder vaak dezelfde vraag terugkomt. Later kan de vragenbank naar de database (dan krijgt `Question` een kolom `skill` en `difficulty`, en de quiz-editor twee keuzelijsten).

---

## Samenvatting: wat heb je geleerd?

- **Eerst kijken wat er al is.** De vaardigheden stonden al bij de spelers in het geheugen, en `src/utils/skills.js` bestond al. Daardoor was er geen databasewijziging en geen tweede lijst nodig, anders dan de chat dacht.
- **Een algoritme als pure functie.** `questionSelector.js` krijgt alles mee wat het nodig heeft en verandert niets anders. Daardoor kon je het testen met een vaste "toevalsfunctie" en door het 1000 keer te draaien.
- **Gewogen toeval in plaats van "altijd de laagste".** Zo krijgt de zwakste vaardigheid de meeste vragen, maar blijft de quiz gevarieerd.
- **De server is de baas.** Het aantal vragen, de gemiddelden en de gekozen vragen staan op de server; de browser laat alleen zien wat de server stuurt.
- **Het patroon voor een host-actie** (net als bij het slot en de tijdslimiet): eventnaam → handler op de server → `lobby:update` naar iedereen → knop die wacht op de server.
