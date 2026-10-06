# Open ICT Quiz

Een Kahoot-achtige quizwebsite voor school. Een host opent een lobby op het digibord, spelers joinen met een QR-code of een code van 6 cijfers, en na elke vraag zie je de tussenstand. Doel: zichtbaar maken wie waar goed in is, zodat studenten uit de verschillende tribes elkaar makkelijker vinden.

Het volledige plan staat in [`docs/PROJECTPLAN.md`](docs/PROJECTPLAN.md). Het socket-contract staat in [`docs/SOCKET-EVENTS.md`](docs/SOCKET-EVENTS.md).

**Stack:** React + Vite + Ant Design (client) · Node.js + Express + Socket.IO (server) · PostgreSQL + Prisma · Docker Compose.

## Wat heb je nodig

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (moet aan staan)
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/), met de aanbevolen extensies: ESLint, Prettier, Docker, Prisma (VS Code stelt ze zelf voor)

Node, PHP of Postgres hoef je **niet** te installeren: alles draait in Docker.

## Eerste keer opstarten

```bash
git clone <repo-url>
cd <repo-map>
cp .env.example .env        # Windows PowerShell: copy .env.example .env
docker compose up --build
```

Daarna:

| Wat | Adres |
|---|---|
| De app | http://localhost:5173 |
| API-health | http://localhost:3000/api/health |
| Database bekijken (Adminer) | http://localhost:8080 (systeem: PostgreSQL, server: `db`, gebruiker/wachtwoord: `quiz`/`quiz`, database: `quizapp`) |
| Socket-test (alleen dev) | http://localhost:5173/dev/socket |

De database wordt bij het opstarten automatisch gemigreerd en gevuld met voorbeeldquizzen.

## Dagelijks gebruik

- Starten: `docker compose up` · Stoppen: `Ctrl+C` of `docker compose down`
- Logs van één service: `docker compose logs -f server`
- Wijzigingen in `client/src` en `server/src` worden automatisch herladen.

## Een npm-package toevoegen

```bash
docker compose exec client npm install <pakket>    # of: server
```

Commit daarna `package.json` **en** `package-lock.json`.

## Na een `git pull` met nieuwe packages

```bash
docker compose up --build -V
```

`-V` ververst de `node_modules`-volumes, anders mist de container de nieuwe packages.

## Database

- Schema gewijzigd (`server/prisma/schema.prisma`):
  `docker compose exec server npx prisma migrate dev --name <wat-je-deed>` en commit de nieuwe map in `server/prisma/migrations`.
- Seed opnieuw draaien: `docker compose exec server npx prisma db seed`
  (bestaande quizzen met dezelfde titel worden overgeslagen).
- Alles resetten (**wist alle data!**): `docker compose down -v` en daarna `docker compose up --build`

## Tests & lint

```bash
docker compose exec server npm test
docker compose exec server npm run lint
docker compose exec client npm run lint
```

## Testen met telefoons

- De QR-code verwijst naar `PUBLIC_URL` uit `.env`, of anders naar het adres waarop de host-pagina open staat.
- Open je de host-pagina via `localhost`, dan werkt de QR **niet** op telefoons. Open de host-pagina via je LAN-IP (bijv. `http://192.168.1.23:5173`, vind je IP met `ipconfig` / `ifconfig`) of zet `PUBLIC_URL=http://192.168.1.23:5173` in `.env` en herstart.
- Sommige wifi-netwerken (zoals schoolwifi) blokkeren verkeer tussen apparaten. Test dan via een hotspot.

## Testen met meerdere spelers op één laptop

Sessies lopen via **cookies**, en tabbladen in dezelfde browser delen cookies. Gebruik daarom voor elke extra speler een **incognitovenster** of een **andere browser** (of je telefoon). Host + één speler in dezelfde browser kan wel.

Een speler "resetten": DevTools → Application → Cookies → `quiz_player` verwijderen.

## Problemen oplossen

| Probleem | Oplossing |
|---|---|
| `port is already allocated` (5173/3000/5432/8080) | Een ander programma gebruikt de poort. Stop het (bijv. een lokale Postgres) of verander de linker poort in `docker-compose.yml`. |
| `Cannot connect to the Docker daemon` | Start Docker Desktop en wacht tot hij groen is. |
| Wijzigingen worden niet herladen | Controleer dat `CHOKIDAR_USEPOLLING: "true"` (client) en `nodemon -L` (server) aan staan. Herstart met `docker compose restart client`. |
| Prisma-fout over de client (`@prisma/client did not initialize`) | `docker compose exec server npx prisma generate` en daarna `docker compose restart server`. |
| Package niet gevonden na `git pull` | `docker compose up --build -V` |
| Rare fouten in shell-scripts / regeleinden op Windows | `.gitattributes` zet alles op LF. Clone opnieuw of draai `git add --renormalize .` |

## Meer lezen

- [`CONTRIBUTING.md`](CONTRIBUTING.md): git-workflow, branches, PR-regels en code-stijl
- [`docs/PROJECTPLAN.md`](docs/PROJECTPLAN.md): wat we bouwen en in welke volgorde
- [`docs/SOCKET-EVENTS.md`](docs/SOCKET-EVENTS.md): alle REST-endpoints en socket-events
- [`docs/IDEEEN.md`](docs/IDEEEN.md): ideeën voor later
