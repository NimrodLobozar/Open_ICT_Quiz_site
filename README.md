# Open ICT Quiz

React + Vite frontend with an Express API and PostgreSQL database.

## Run with Docker

```bash
docker compose up --build
```

Open the frontend at http://localhost:5173. The API is available at http://localhost:3000 and PostgreSQL is exposed on port 5432.

The first backend start runs `prisma db push` to create the database tables from `prisma/schema.prisma`. PostgreSQL data is stored in the `postgres-data` Docker volume.

### Live reload: no rebuild needed for frontend changes

Your project folder is mounted into the frontend container, so Vite sees every change you save in `src/` (`.jsx`, `.css`, …) and updates the page at http://localhost:5173 right away. You don't need to rebuild after editing code, and you don't need to rebuild after a pull or merge either, as long as only code changed.

Two cases still need a rebuild:

- **`package.json` changed** (someone added or updated a package):

  ```bash
  docker compose up -d --build -V
  ```

  `--build` rebuilds the image, which runs `npm install` with the new packages. `-V` throws away the old `node_modules` volume of the container and creates a fresh one from the new image. Without `-V`, Docker keeps the old `node_modules`, and the new package is "missing" even after a rebuild.

- **Backend code changed** (`backend/`, `prisma/`): the backend has no live reload. Its code is copied into the image, so run `docker compose up -d --build backend`.

Stop the services with:

```bash
docker compose down
```

To also delete the database volume:

```bash
docker compose down -v
```
