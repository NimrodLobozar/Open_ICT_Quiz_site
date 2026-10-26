import { execSync } from 'node:child_process'
import pg from 'pg'

// Draait één keer vóór alle API-tests: maakt de testdatabase aan (als die er nog niet is)
// en zet het Prisma-schema erin. Geen migraties nodig: net als in development gebruiken we db push.
export default async function setup() {
  const url = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://quiz:quiz@localhost:5433/quiz_test')
  const database = url.pathname.slice(1)
  // Veiligheidsgordel: deze tests wissen alles. Nooit tegen een database die niet op _test eindigt.
  if (!database.endsWith('_test')) throw new Error(`Weiger tests te draaien op database "${database}" (moet op _test eindigen).`)

  const admin = new URL(url)
  admin.pathname = '/postgres'
  const client = new pg.Client({ connectionString: admin.toString() })
  await client.connect()
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database])
  // Identifier kan niet als $1-parameter; de naam is hierboven gecontroleerd en komt uit onze eigen config.
  if (rowCount === 0) await client.query(`CREATE DATABASE "${database}"`)
  await client.end()

  // Gewone db push (geen --force-reset): zet nieuwe tabellen en kolommen erbij. Elke test leegt zelf de tabellen
  // (resetDatabase in helpers.js). Lukt de push niet na een grote schemawijziging, wis dan de testdatabase:
  //   docker compose exec db dropdb -U quiz quiz_test
  try {
    execSync('npx prisma db push', { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe' })
  } catch (error) {
    throw new Error(`prisma db push op ${database} mislukt:
${error.stderr?.toString() ?? error.message}`)
  }
}
