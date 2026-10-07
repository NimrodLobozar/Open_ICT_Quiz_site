# Samenwerken aan de Open ICT Quiz

## Git-workflow

- `main` is altijd werkend en beschermd: **niemand pusht direct naar `main`**.
- Per taak een branch:
  - `feature/<korte-naam>` voor nieuwe functionaliteit (bijv. `feature/lobby-lock`)
  - `fix/<korte-naam>` voor bugfixes
  - `docs/<korte-naam>` voor documentatie
- Pull Request naar `main` met minimaal **1 review** van een teamgenoot.
- Zet in je PR: **wat** je deed, **hoe** je het testte, en een **screenshot** bij UI-werk.
- Commitberichten kort en in de gebiedende wijs: `Voeg lobby-lock toe`, `Fix dubbele naam check`.

### Vóór je een PR opent

```bash
git pull origin main          # conflicten oplossen
docker compose exec server npm test
docker compose exec server npm run lint
docker compose exec client npm run lint
```

## Code-stijl

- **Prettier** formatteert, **ESLint** controleert. Geen discussies over spaties. Zet in VS Code "Format on Save" aan.
- JavaScript, geen TypeScript.
- Engelse namen voor variabelen, functies en bestanden. Nederlandstalig commentaar bij lastige stukken.
- Componenten in `PascalCase.jsx`, hooks in `useCamelCase.js`, overige bestanden in `camelCase.js`.
- Eén component per bestand. Pagina's in `client/src/pages/`, herbruikbare stukken in `client/src/components/`.
- Gebruik **antd-componenten** in plaats van eigen knoppen/formulieren. Kleuren pas je aan in `client/src/theme.js`, niet per component.
- Event-namen **nooit** als losse string: altijd via `events.js`.
- Wijzig je een eventnaam? Pas dan `server/src/constants/events.js`, `client/src/socket/events.js` **én** `docs/SOCKET-EVENTS.md` aan in dezelfde PR.
- Geen geheimen in Git: `.env` staat in `.gitignore`, alleen `.env.example` wordt gecommit.

## Belangrijke afspraken in de code

- **De server is de baas.** De server houdt de timer bij, controleert antwoorden en berekent punten. Stuur `isCorrect` **nooit** naar een client voordat de vraag voorbij is.
- **Sessies alleen via httpOnly-cookies** (`quiz_player`, `quiz_host`). Gebruik nooit `localStorage` of `sessionStorage` om te onthouden wie iemand is.
- Game-logica (`server/src/game/`) weet niets van Socket.IO of Express. Gooi een `GameError` als iets niet mag; routes en socket-handlers sturen die netjes terug.
- Schrijf tests voor game-logica in `server/tests/`.

## Waar moet ik beginnen?

Zoek in de code naar `TODO(team` — daar staat per plek uitgelegd wat er nog moet gebeuren en in welke fase. De bouwvolgorde staat in `docs/PROJECTPLAN.md` hoofdstuk 9.

De pagina's voor `/quizzes`, `/host/new/:quizId`, `/host/:code`, `/join` en `/play/:code` zijn leeg: die bouwen we zelf. In elk bestand in `client/src/pages/` staat bovenaan een `TODO(team)`-blok met wat de pagina moet doen; de skeleton-versie staat als voorbeeld in [`docs/reference/`](docs/reference/README.md).
