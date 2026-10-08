# Open ICT Quiz

React + Vite frontend with an Express API and PostgreSQL database.

## Run with Docker

```bash
docker compose up --build
```

Open the frontend at http://localhost:5173. The API is available at http://localhost:3000 and PostgreSQL is exposed on port 5432.

The first backend start runs `prisma db push` to create the database tables from `prisma/schema.prisma`. PostgreSQL data is stored in the `postgres-data` Docker volume.

Stop the services with:

```bash
docker compose down
```

To also delete the database volume:

```bash
docker compose down -v
```
