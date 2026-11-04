# Open ICT Quiz

Live classroom quiz: a host shows the quiz on a big screen, students join with a 6-digit code on their laptop or phone. Students can play as a guest or with an HU account, so their scores are saved.

React + Vite frontend with an Express + Socket.IO API and a PostgreSQL database (Prisma).

More documentation is in `docs/` (accounts, mail, database, Socket.IO).

## Run with Docker

```bash
docker compose up --build
```

| What | Address |
|---|---|
| Site | http://localhost:5173 |
| API | http://localhost:3000 |
| Adminer (database in the browser) | http://localhost:8080 |
| Mailpit (catches every mail in development) | http://localhost:8025 |
| PostgreSQL (for a database tool) | `localhost:5433` |

To look inside the database, open Adminer at http://localhost:8080 and log in with system **PostgreSQL**, server **db**, user/password/database **quiz**. Port 5433 is not a web page: use it only in a database tool such as DBeaver or pgAdmin (`localhost:5433`).

### Test accounts

The first backend start creates these accounts (development only, never on the server):

| Role | E-mail | Password |
|---|---|---|
| Admin | `beheerder@quiz.local` | `Beheerder123` |
| Teacher | `docent@hu.nl` | `Docent123` |
| Student | `emma@student.hu.nl`, `daan@student.hu.nl` | `Student123` |

New accounts must use an HU address (`@student.hu.nl` or `@hu.nl`) and confirm it via a mail. In development that mail lands in Mailpit.

### Database

The first backend start runs `prisma db push` to create the database tables from `prisma/schema.prisma`. PostgreSQL data is stored in the `postgres-data` Docker volume.

### Live reload: no rebuild needed for code changes

Your code is mounted into the containers, so changes show up without a rebuild:

- **Frontend:** Vite sees every change you save in `src/` (`.jsx`, `.css`, …) and updates the page at http://localhost:5173 right away.
- **Backend:** nodemon restarts the API when you save a file in `backend/` (takes a few seconds). When you change `prisma/schema.prisma`, it first updates the database tables (`prisma db push`) and regenerates the Prisma client. If a schema change would delete data, `db push` stops with an error in `docker compose logs backend`; then decide yourself, for example by resetting the database with `docker compose down -v`.

You don't need to rebuild after a pull or merge either, as long as only code changed.

One case still needs a rebuild:

- **`package.json` changed** (someone added or updated a package):

  ```bash
  docker compose up -d --build -V
  ```

  `--build` rebuilds the image, which runs `npm install` with the new packages. `-V` throws away the old `node_modules` volume of the container and creates a fresh one from the new image. Without `-V`, Docker keeps the old `node_modules`, and the new package is "missing" even after a rebuild.

Stop the services with:

```bash
docker compose down
```

To also delete the database volume:

```bash
docker compose down -v
```

## Tests

```bash
npm test            # unit tests, no database needed
npm run test:api    # API tests against a separate quiz_test database (Docker must run)
npm run test:smoke  # plays the whole flow against a test backend on port 3001
```

## Mail

By default every mail goes to Mailpit (http://localhost:8025), so nothing leaves your computer. To send real mail, put the Gmail SMTP settings in a `.env` file next to `docker-compose.yml` (never in git) and restart the backend. Step by step: `docs/MAIL.md`.

HU mailboxes (Microsoft 365) sometimes put the mails in Junk, and Outlook rewrites the links into `safelinks.protection.outlook.com` links. Both are normal and the links still work.

## Test on a phone or another device

Phones join through your computer's **network address**, not `localhost` (on a phone, `localhost` means the phone itself).

1. Put the phone on the **same Wi-Fi/network** as your computer. School and guest networks often block devices from reaching each other; a phone hotspot is a good fallback.
2. Find your computer's IP address: `ipconfig` (Windows, "IPv4 Address") or `ipconfig getifaddr en0` (macOS). Example: `192.168.2.2`.
3. On the computer, open the host screen via that address too, e.g. `http://192.168.2.2:5173/host`. The lobby shows the join address students should use, so it must not say `localhost`.
4. On the phone, open `http://192.168.2.2:5173/join` and enter the code.

Only port **5173** has to be reachable: the API and Socket.IO go through Vite's proxy on the same port.

**Windows firewall.** Docker Desktop's firewall rule often only allows the *Public* network profile. On a *Private* network (check with `Get-NetConnectionProfile` in PowerShell), Windows then blocks the phone. Allow port 5173 once, in **PowerShell as administrator**:

```powershell
New-NetFirewallRule -DisplayName "Open ICT Quiz (Vite 5173)" -Direction Inbound -Protocol TCP -LocalPort 5173 -Profile Private -Action Allow
```

Remove it again with `Remove-NetFirewallRule -DisplayName "Open ICT Quiz (Vite 5173)"`. On macOS, allow incoming connections for Docker when asked.

## Deploy on the server (Portainer)

The server uses `docker-compose.server.yml`, not `docker-compose.yml`:

- The frontend is a production build served by nginx (`Dockerfile.frontend`). nginx forwards `/api` and `/socket.io` to the backend, on port 5173.
- The code is copied into the images (nothing is mounted). **After every update: redeploy and rebuild the images**, otherwise the old version keeps running.
- The database lives in the `postgres-data` volume and survives a rebuild.

Set these as environment variables of the stack in Portainer (no quotes around the values), then redeploy:

| Variable | What |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Database login |
| `APP_URL` | Address of the site, for links in mails (default `https://quiz.flobozar.com`) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | The first admin. Created once on start; changing the password here later does nothing (change it on the site) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Mail via Gmail: `smtp.gmail.com`, `465`, the Gmail address, an app password, the Gmail address |

Admin can't log in on the server? Open the console of the backend container and run `node backend/scripts/checkAdmin.js`. It shows whether the admin exists and whether the password matches `SEED_ADMIN_PASSWORD` (`--reset` sets it to that value). See `docs/ACCOUNTS.md`.
