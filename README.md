# Open ICT Quiz

React + Vite frontend with an Express API and PostgreSQL database.

## Run with Docker

```bash
docker compose up --build
```

Open the frontend at http://localhost:5173. The API is available at http://localhost:3000 and PostgreSQL is exposed on port 5432.

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
