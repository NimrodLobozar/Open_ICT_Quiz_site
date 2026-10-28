// Start de test-backend (dienst backend-test in docker-compose.yml, http://localhost:3001) en draait daarna
// een testscript ertegen. Gebruikt door npm run test:smoke en npm run test:visual.
//
// Waarom een aparte backend? Die tests registreren verzonnen HU-adressen. De gewone backend leest .env, en
// daar staat misschien Brevo in: dan zouden die mails echt verstuurd worden. backend-test leest test.env
// (altijd Mailpit), dus je hoeft .env nooit aan te passen om te testen.
//
// Gebruik: node scripts/with-test-backend.mjs scripts/smoke-test.mjs
// Zelf een adres opgeven (SMOKE_URL of VISUAL_URL)? Dan start dit script niets en test het gewoon daartegen.
import { execSync, spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEST_URL = 'http://localhost:3001'
const script = process.argv[2]
if (!script) {
  console.error('Gebruik: node scripts/with-test-backend.mjs <testscript>')
  process.exit(1)
}

const ownUrl = process.env.SMOKE_URL ?? process.env.VISUAL_URL
if (!ownUrl) {
  console.log('Test-backend starten (backend-test, mail via test.env → Mailpit)…')
  // --build: na een wijziging in package.json heeft de test-backend meteen de nieuwe pakketten.
  // Docker gebruikt zijn cache, dus als er niets veranderd is, duurt dit maar een paar seconden.
  execSync('docker compose --profile test up -d --build backend-test', { cwd: ROOT, stdio: 'inherit' })
  await waitForHealth(`${TEST_URL}/api/health`)
}

// Het testscript krijgt het adres van de test-backend mee, tenzij je zelf een adres hebt opgegeven.
const env = { ...process.env, SMOKE_URL: process.env.SMOKE_URL ?? TEST_URL, VISUAL_URL: process.env.VISUAL_URL ?? TEST_URL }
const child = spawn(process.execPath, [resolve(ROOT, script)], { cwd: ROOT, env, stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 1))

/** Wacht tot de server antwoordt. Bij de eerste start zet hij eerst het databaseschema klaar; dat duurt even. */
async function waitForHealth(url, timeoutMs = 120_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const response = await fetch(url).catch(() => null)
    if (response?.ok) return
    await new Promise((done) => setTimeout(done, 1000))
  }
  console.error(`De test-backend antwoordt niet op ${url}. Kijk in: docker compose logs backend-test`)
  process.exit(1)
}
