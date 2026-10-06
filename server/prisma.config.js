// Prisma-configuratie (Prisma 7+). De database-URL komt uit de omgeving:
// in Docker zet docker-compose.yml DATABASE_URL, lokaal kun je server/.env gebruiken.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    // Geen env() hier: dan werkt `prisma generate` ook tijdens de Docker-build (zonder database).
    url: process.env.DATABASE_URL ?? '',
  },
})
