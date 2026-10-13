# Open ICT Quiz

React + Vite frontend with an Express API and PostgreSQL database.

## Run with Docker

```bash
docker compose up --build
```

Open the frontend at http://localhost:5173. The API is available at http://localhost:3000 and PostgreSQL is exposed on port 5433.

To look inside the database, open Adminer at http://localhost:8080 and log in with system **PostgreSQL**, server **db**, user/password/database **quiz**. Port 5433 is not a web page: use it only in a database tool such as DBeaver or pgAdmin (`localhost:5433`).

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

## Test on a phone or another device

Phones join through your computer's **network address**, not `localhost` (on a phone, `localhost` means the phone itself).

1. Put the phone on the **same Wi-Fi/network** as your computer. School and guest networks often block devices from reaching each other; a phone hotspot is a good fallback.
2. Find your computer's IP address: `ipconfig` (Windows, "IPv4 Address") or `ipconfig getifaddr en0` (macOS). Example: `192.168.2.2`.
3. On the computer, open the host screen via that address too, e.g. `http://192.168.2.2:5173/host/new`. The lobby shows the join address students should use, so it must not say `localhost`.
4. On the phone, open `http://192.168.2.2:5173/join` and enter the code.

Only port **5173** has to be reachable: the API and Socket.IO go through Vite's proxy on the same port.

**Windows firewall.** Docker Desktop's firewall rule often only allows the *Public* network profile. On a *Private* network (check with `Get-NetConnectionProfile` in PowerShell), Windows then blocks the phone. Allow port 5173 once, in **PowerShell as administrator**:

```powershell
New-NetFirewallRule -DisplayName "Open ICT Quiz (Vite 5173)" -Direction Inbound -Protocol TCP -LocalPort 5173 -Profile Private -Action Allow
```

Remove it again with `Remove-NetFirewallRule -DisplayName "Open ICT Quiz (Vite 5173)"`. On macOS, allow incoming connections for Docker when asked.
