// Eén gedeelde PrismaClient voor de hele server.
// Prisma 7 praat met Postgres via een "driver adapter" (het pg-pakket).
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from '../config.js'

const adapter = new PrismaPg({ connectionString: config.databaseUrl })

export const prisma = new PrismaClient({ adapter })
