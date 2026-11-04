// Visuele API-test voor de backend-taken van de user stories van sprint 2.
// Doet echte HTTP-verzoeken tegen de DRAAIENDE site (net als Postman) en zet elk verzoek + antwoord
// in een HTML-rapport, met per story een screenshot (PNG). Zo kun je laten zien dát de API werkt.
//
// Gebruik (Docker moet draaien):
//   npm run test:visual                                   (start de test-backend en test op http://localhost:3001)
//   VISUAL_URL=http://localhost:5173 npm run test:visual   (tegen de gewone site; start niets, gebruikt dus .env!)
// Uitkomst: test-reports/api-visual/index.html (open in je browser) en test-reports/api-visual/screenshots/*.png
//
// Mails (uitnodiging, bevestiging, resetlink) haalt de test uit Mailpit (MAILPIT_URL, standaard http://localhost:8025).
// De test-backend haalt zijn mail-instellingen uit test.env (altijd Mailpit), niet uit .env. Zo gaan er geen echte
// mails naar verzonnen HU-adressen, ook als Brevo in .env staat. Zie scripts/with-test-backend.mjs.
//
// Let op: maakt echte rijen in de database. Testaccounts en quizzen worden aan het eind weer verwijderd;
// de gespeelde ronde blijft (anoniem) staan bij Uitslagen, met de titel "Visuele test".
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { io } from 'socket.io-client'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'test-reports', 'api-visual')
const BASE = (process.env.VISUAL_URL ?? 'http://localhost:3001').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'beheerder@quiz.local'
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'Beheerder123'
const MAILPIT = (process.env.MAILPIT_URL ?? 'http://localhost:8025').replace(/\/$/, '')
const STAMP = Date.now().toString(36)

// Echte User-Agents, zodat story 9 verschillende apparaten laat zien.
const UA = {
  laptop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
}

const STORIES = {
  S1: { title: 'Account aanmaken', task: 'POST /api/auth/register: invoer controleren, wachtwoord hashen, dubbel e-mailadres weigeren' },
  S2: { title: 'Inloggen en uitloggen', task: 'POST /api/auth/login en /logout met httpOnly-cookie; requireAuth en requireRole' },
  S3: { title: 'Wachtwoord vergeten', task: 'POST /api/auth/forgot (altijd zelfde antwoord) en POST /api/auth/password met eenmalige link' },
  S4: { title: 'Eigen resultaten terugkijken', task: 'GET /api/me/results met samenvatting (gespeeld, beste plaats, podiumplaatsen)' },
  S5: { title: 'Profiel en vaardigheden aanpassen', task: 'PATCH /api/me en POST /api/me/password (vraagt huidig wachtwoord)' },
  S6: { title: 'Account verwijderen', task: 'DELETE /api/me met wachtwoord; uitslagen van anderen blijven kloppen; uitloggen' },
  S7: { title: 'Quizzen beheren en hosten', task: 'GET/POST /api/quizzes; hosten met quizId; concept-quiz weigeren' },
  S8: { title: 'Standaardinstellingen voor quizzen', task: 'GET/PUT /api/me/quiz-defaults; nieuwe quiz neemt ze over' },
  S9: { title: 'Ingelogde apparaten beheren', task: 'GET /api/me/sessions en POST /api/me/sessions/revoke-others' },
  S10: { title: 'Gebruikers bekijken en zoeken', task: 'GET /api/admin/users met rolfilter, zoeken en pagina\u2019s; alleen ADMIN' },
  S11: { title: 'Docentaccount aanmaken', task: 'POST /api/admin/users (uitnodigingslink) en PATCH /api/admin/users/:id/role' },
  S12: { title: 'Gebruiker aanpassen of verwijderen', task: 'PATCH en DELETE /api/admin/users/:id' },
  S13: { title: 'Echte e-mails versturen', task: 'SMTP via nodemailer (Mailpit in development); mailSent en POST /api/admin/users/:id/resend-invite' },
  S14: { title: 'Alleen registreren met een HU-mailadres', task: 'isHuEmail, EMAIL_NOT_HU, POST /api/auth/verify-email en /resend-verification, EMAIL_NOT_VERIFIED' },
}
const steps = Object.fromEntries(Object.keys(STORIES).map((key) => [key, []]))

/** Een "browser" met eigen cookies. Elk verzoek wordt vastgelegd voor het rapport. */
function browser(name, userAgent = UA.laptop) {
  const cookies = new Map()
  const cookieHeader = () => [...cookies].map(([key, value]) => `${key}=${value}`).join('; ')
  async function request(path, { method = 'GET', body } = {}) {
    const started = Date.now()
    const response = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Cookie: cookieHeader(), 'User-Agent': userAgent },
      body: body ? JSON.stringify(body) : undefined,
    })
    const setCookies = response.headers.getSetCookie()
    for (const line of setCookies) {
      const [pair] = line.split(';')
      const [key, value] = pair.split('=')
      if (value) cookies.set(key, value)
      else cookies.delete(key)
    }
    const data = await response.json().catch(() => ({}))
    return {
      name,
      method,
      path,
      body,
      sentCookies: [...cookies.keys()],
      status: response.status,
      data,
      setCookies,
      ms: Date.now() - started,
    }
  }
  return { request, cookieHeader, cookies, name }
}

/** Doet een verzoek, controleert het, en zet het onder de juiste story in het rapport. */
async function step(story, label, agent, path, options, expect) {
  let result
  try {
    result = await agent.request(path, options)
  } catch (error) {
    result = { name: agent.name, method: options?.method ?? 'GET', path, body: options?.body, status: 0, data: { error: String(error) }, setCookies: [] }
  }
  const ok = Boolean(expect(result))
  steps[story].push({ label, ok, ...result })
  console.log(`  ${ok ? '✓' : '✗'} [${story}] ${label}  (${result.status})`)
  return result
}

/** Een stap zonder HTTP-verzoek (bijv. iets uit de backendlog of via WebSocket). */
function note(story, label, ok, detail) {
  steps[story].push({ label, ok, note: detail })
  console.log(`  ${ok ? '✓' : '✗'} [${story}] ${label}`)
}

function connect(agent, code, role) {
  return new Promise((done, fail) => {
    const socket = io(BASE, {
      transports: ['websocket'],
      extraHeaders: { Cookie: agent.cookieHeader() },
      auth: { code, role },
      reconnection: false,
    })
    socket.once('connect', () => done(socket))
    socket.once('connect_error', fail)
  })
}
const emit = (socket, event, payload) =>
  new Promise((done) => socket.timeout(5000).emit(event, payload, (error, ack) => done(error ? { ok: false } : ack)))
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

/** De nieuwste link met `path` uit een mail aan `email`, uit de Mailpit-inbox (net zoals jij hem op :8025 opent). */
async function linkFromMailpit(email, path) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`).catch(() => null)
    if (search?.ok) {
      for (const { ID } of (await search.json()).messages ?? []) {
        const message = await (await fetch(`${MAILPIT}/api/v1/message/${ID}`)).json()
        const link = message.Text?.match(/https?:\/\/\S+/)?.[0]
        if (link?.includes(path)) return link
      }
    }
    await sleep(250)
  }
  return null
}
const shortLink = (link) => link.replace(/token=(.{8}).*/, 'token=$1…')

const questions = [
  { text: 'Hoeveel bits zitten er in een byte?', options: [{ text: '4' }, { text: '8', isCorrect: true }] },
  { text: 'Waar staat HTML voor?', options: [{ text: 'HyperText Markup Language', isCorrect: true }, { text: 'Home Tool Markup Language' }] },
]

async function run() {
  const anonymous = browser('anoniem')
  const admin = browser('beheerder')
  const student = browser('student (laptop)')
  const studentPhone = browser('student (iPhone)', UA.iphone)
  const teacher = browser('docent')
  const guest = browser('gast')

  const health = await anonymous.request('/health')
  if (health.status !== 200) throw new Error(`Server niet bereikbaar op ${BASE} (status ${health.status}). Draait Docker?`)

  const studentEmail = `visueel-student-${STAMP}@student.hu.nl`
  const studentName = `Emma${STAMP}`.slice(0, 20)
  const teacherEmail = `visueel-docent-${STAMP}@hu.nl`
  let studentPassword = 'Student123'

  // ---------- S1: account aanmaken ----------
  console.log('S1 Account aanmaken')
  await step('S1', 'Zonder akkoord privacyregels → geweigerd', anonymous, '/auth/register',
    { method: 'POST', body: { username: studentName, email: studentEmail, password: 'Student123' } },
    (r) => r.status === 400 && r.data.error === 'PRIVACY_REQUIRED')
  await step('S1', 'Zwak wachtwoord (geen cijfer/hoofdletter) → geweigerd', anonymous, '/auth/register',
    { method: 'POST', body: { username: studentName, email: studentEmail, password: 'aaaaaaaa', acceptPrivacy: true } },
    (r) => r.status === 400)
  const register = await step('S1', 'Geldig account; rol ADMIN meesturen wordt genegeerd → STUDENT', student, '/auth/register',
    { method: 'POST', body: { username: studentName, email: studentEmail, password: 'Student123', acceptPrivacy: true, role: 'ADMIN' } },
    (r) => r.status === 201 && r.data.user?.role === 'STUDENT' && !('passwordHash' in (r.data.user ?? {})))
  await step('S1', 'Zelfde e-mailadres nog een keer → geweigerd', anonymous, '/auth/register',
    { method: 'POST', body: { username: `${studentName}x`.slice(0, 20), email: studentEmail, password: 'Student123', acceptPrivacy: true } },
    (r) => r.status === 409)

  // ---------- S14: alleen HU-adressen, e-mail bevestigen ----------
  console.log('S14 Alleen HU-adressen')
  for (const email of [`emma-${STAMP}@gmail.com`, `emma-${STAMP}@nephu.nl`, `emma-${STAMP}@hu.nl.voorbeeld.com`]) {
    await step('S14', `Registreren met ${email.split('@')[1]} → geweigerd`, anonymous, '/auth/register',
      { method: 'POST', body: { username: `${studentName}y`.slice(0, 20), email, password: 'Student123', acceptPrivacy: true } },
      (r) => r.status === 400 && r.data.error === 'EMAIL_NOT_HU')
  }
  await step('S14', 'Na registreren nog niet ingelogd: eerst bevestigen', student, '/auth/login',
    { method: 'POST', body: { email: studentEmail, password: 'Student123' } },
    (r) => r.status === 403 && r.data.error === 'EMAIL_NOT_VERIFIED' && !r.setCookies.some((c) => c.startsWith('quiz_auth=')))
  await step('S14', 'Bevestigingsmail opnieuw sturen → altijd hetzelfde antwoord', anonymous, '/auth/resend-verification',
    { method: 'POST', body: { email: studentEmail } }, (r) => r.status === 200 && r.data.ok === true)
  // De nieuwe mail wordt op de achtergrond verstuurd en maakt de eerste link ongeldig: even wachten tot hij er is.
  await sleep(1500)
  const verifyLink = await linkFromMailpit(studentEmail, '/email-bevestigen')
  note('S14', 'Bevestigingsmail gevonden in Mailpit', Boolean(verifyLink), verifyLink ? shortLink(verifyLink) : `Geen mail in ${MAILPIT}. Draait Mailpit?`)
  const verifyToken = verifyLink ? new URL(verifyLink).searchParams.get('token') : 'geen'
  await step('S14', 'Een bevestigingslink kan geen wachtwoord instellen', anonymous, `/auth/password-link?token=${verifyToken}`, {},
    (r) => r.status === 400)
  await step('S14', 'E-mailadres bevestigen via de link', anonymous, '/auth/verify-email',
    { method: 'POST', body: { token: verifyToken } }, (r) => r.status === 200)
  await step('S14', 'Na bevestigen: inloggen lukt, httpOnly-cookie gezet', student, '/auth/login',
    { method: 'POST', body: { email: studentEmail, password: 'Student123' } },
    (r) => r.status === 200 && r.setCookies.some((c) => c.startsWith('quiz_auth=') && /HttpOnly/i.test(c)))

  // ---------- S2: inloggen en uitloggen ----------
  console.log('S2 Inloggen en uitloggen')
  await step('S2', 'Fout wachtwoord → 401, zelfde melding als onbekend e-mailadres', anonymous, '/auth/login',
    { method: 'POST', body: { email: studentEmail, password: 'Fout12345' } },
    (r) => r.status === 401 && r.data.error === 'INVALID_LOGIN')
  await step('S2', 'Onbekend e-mailadres → zelfde 401', anonymous, '/auth/login',
    { method: 'POST', body: { email: `bestaat-niet-${STAMP}@student.hu.nl`, password: 'Fout12345' } },
    (r) => r.status === 401 && r.data.error === 'INVALID_LOGIN')
  await step('S2', 'Beheerder logt in → cookie gezet', admin, '/auth/login',
    { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } },
    (r) => r.status === 200 && r.data.user?.role === 'ADMIN')
  await step('S2', 'Wie ben ik? (met cookie)', student, '/auth/me', {}, (r) => r.data.user?.email === studentEmail)
  await step('S2', 'Niet ingelogd → beveiligde route geeft 401 (requireAuth)', anonymous, '/me/results', {}, (r) => r.status === 401)
  await step('S2', 'Student → admin-route geeft 403 (requireRole)', student, '/admin/users', {}, (r) => r.status === 403 && r.data.error === 'FORBIDDEN')

  // ---------- S10 / S11: docent uitnodigen en gebruikers zoeken ----------
  console.log('S11 Docentaccount aanmaken')
  await step('S14', 'Docent zonder HU-adres → geweigerd', admin, '/admin/users',
    { method: 'POST', body: { username: `Docent${STAMP}`.slice(0, 20), email: `docent-${STAMP}@gmail.com` } },
    (r) => r.status === 400 && r.data.error === 'EMAIL_NOT_HU')
  const invite = await step('S11', 'Beheerder maakt docent aan → uitnodiging gemaild (mailSent)', admin, '/admin/users',
    { method: 'POST', body: { username: `Docent${STAMP}`.slice(0, 20), email: teacherEmail } },
    (r) => r.status === 201 && r.data.user?.role === 'TEACHER' && r.data.mailSent === true)
  await step('S13', 'Uitnodiging opnieuw sturen (oude link vervalt)', admin, `/admin/users/${invite.data.user?.id}/resend-invite`,
    { method: 'POST' }, (r) => r.status === 200 && r.data.mailSent === true)
  const inviteLink = invite.data.inviteLink ?? (await linkFromMailpit(teacherEmail, '/wachtwoord-instellen'))
  note('S13', 'Uitnodigingsmail aangekomen in Mailpit', Boolean(inviteLink), inviteLink ? shortLink(inviteLink) : `Geen mail in ${MAILPIT}. Draait Mailpit?`)
  const inviteToken = inviteLink ? new URL(inviteLink).searchParams.get('token') : ''
  await step('S11', 'Docent kan nog niet inloggen (nog geen wachtwoord)', anonymous, '/auth/login',
    { method: 'POST', body: { email: teacherEmail, password: 'Docent123' } }, (r) => r.status === 401)
  await step('S11', 'Docent kiest wachtwoord via de link', anonymous, '/auth/password',
    { method: 'POST', body: { token: inviteToken, password: 'Docent123' } }, (r) => r.status === 200)
  await step('S11', 'Docent logt in met rol TEACHER', teacher, '/auth/login',
    { method: 'POST', body: { email: teacherEmail, password: 'Docent123' } }, (r) => r.data.user?.role === 'TEACHER')
  const adminMe = await admin.request('/auth/me')
  await step('S11', 'Beheerder haalt eigen beheerdersrol weg → geweigerd', admin, `/admin/users/${adminMe.data.user?.id}/role`,
    { method: 'PATCH', body: { role: 'STUDENT' } }, (r) => r.status === 409 && r.data.error === 'OWN_ADMIN_ROLE')
  await step('S11', 'Rol die niet bestaat → 400', admin, `/admin/users/${register.data.user?.id}/role`,
    { method: 'PATCH', body: { role: 'KONING' } }, (r) => r.status === 400 && r.data.error === 'INVALID_ROLE')
  await step('S11', 'Docent kan geen rollen wijzigen → 403', teacher, `/admin/users/${register.data.user?.id}/role`,
    { method: 'PATCH', body: { role: 'ADMIN' } }, (r) => r.status === 403)

  console.log('S10 Gebruikers bekijken en zoeken')
  await step('S10', 'Lijst met filter rol = TEACHER', admin, '/admin/users?role=TEACHER', {},
    (r) => r.status === 200 && r.data.users?.every((u) => u.role === 'TEACHER'))
  await step('S10', `Zoeken op deel van e-mailadres ("${STAMP}")`, admin, `/admin/users?q=${STAMP}`, {},
    (r) => r.status === 200 && r.data.users?.length === 2)
  await step('S10', 'Zoeken is hoofdletterongevoelig', admin, `/admin/users?q=${STAMP.toUpperCase()}`, {},
    (r) => r.status === 200 && r.data.users?.length === 2)
  await step('S10', 'Zoeken + rolfilter samen', admin, `/admin/users?q=${STAMP}&role=STUDENT`, {},
    (r) => r.status === 200 && r.data.users?.length === 1 && r.data.users[0].role === 'STUDENT')
  await step('S10', 'Pagina 2 opvragen', admin, '/admin/users?page=2', {}, (r) => r.status === 200)
  await step('S10', 'Docent mag de lijst niet zien → 403', teacher, '/admin/users', {}, (r) => r.status === 403)

  // ---------- S8: standaardinstellingen ----------
  console.log('S8 Standaardinstellingen')
  await step('S8', 'Standaard opslaan: 30 s, tussenstand UIT', teacher, '/me/quiz-defaults',
    { method: 'PUT', body: { timePerQuestion: 30, showCorrectAnswer: true, showStandings: false, lockLobbyOnStart: true } },
    (r) => r.status === 200 && r.data.defaults?.timePerQuestion === 30 && r.data.defaults.showStandings === false)
  await step('S8', 'Standaard ophalen (blijft bewaard)', teacher, '/me/quiz-defaults', {},
    (r) => r.data.defaults?.timePerQuestion === 30 && r.data.defaults.showStandings === false)
  const fromDefaults = await step('S8', 'Nieuwe quiz zonder instellingen → neemt standaard over', teacher, '/quizzes',
    { method: 'POST', body: { title: 'Visuele test standaard', status: 'DRAFT', questions } },
    (r) => r.status === 201 && r.data.quiz.questions[0].timeLimitSec === 30 && r.data.quiz.showStandings === false && r.data.quiz.lockLobbyOnStart === true)
  const overridden = await step('S8', 'Per quiz aanpassen: tussenstand AAN wint van de standaard', teacher, '/quizzes',
    { method: 'POST', body: { title: 'Visuele test eigen', status: 'DRAFT', showStandings: true, lockLobbyOnStart: false, questions } },
    (r) => r.status === 201 && r.data.quiz.showStandings === true && r.data.quiz.lockLobbyOnStart === false)
  await step('S8', 'Student heeft geen quiz-instellingen → 403', student, '/me/quiz-defaults', {}, (r) => r.status === 403)

  // ---------- S7: quizzen beheren en hosten ----------
  console.log('S7 Quizzen beheren en hosten')
  const draft = await step('S7', 'Concept-quiz aanmaken', teacher, '/quizzes',
    { method: 'POST', body: { title: 'Visuele test concept', status: 'DRAFT', questions } }, (r) => r.status === 201 && r.data.quiz.status === 'DRAFT')
  const ready = await step('S7', 'Quiz "klaar om te hosten" aanmaken', teacher, '/quizzes',
    { method: 'POST', body: { title: 'Visuele test', status: 'READY', showStandings: true, questions } }, (r) => r.status === 201 && r.data.quiz.status === 'READY')
  await step('S7', 'Eigen quizzen zoeken (?q=concept)', teacher, '/quizzes?q=concept', {},
    (r) => r.status === 200 && r.data.quizzes?.length >= 1 && r.data.quizzes.every((q) => /concept/i.test(q.title)))
  await step('S7', 'Concept hosten → 409 QUIZ_DRAFT', teacher, '/games', { method: 'POST', body: { quizId: draft.data.quiz?.id } },
    (r) => r.status === 409 && r.data.error === 'QUIZ_DRAFT')
  await step('S7', 'Student kan niet hosten → 403', student, '/games', { method: 'POST', body: { quizId: ready.data.quiz?.id } }, (r) => r.status === 403)
  await step('S7', 'Student ziet geen quizzen → 403', student, '/quizzes', {}, (r) => r.status === 403)
  const created = await step('S7', 'Klare quiz hosten → gamecode', teacher, '/games', { method: 'POST', body: { quizId: ready.data.quiz?.id } },
    (r) => r.status === 201 && /^\d{6}$/.test(r.data.gameCode ?? ''))

  // ---------- S4: ronde spelen en eigen resultaten ----------
  console.log('S4 Eigen resultaten')
  await step('S4', 'Voor de ronde: lege samenvatting', student, '/me/results', {}, (r) => r.data.summary?.played === 0 && r.data.summary.bestRank === null)
  const code = created.data.gameCode
  const adminPlayedBefore = (await admin.request('/me/results')).data.summary?.played
  await step('S4', 'Ingelogde student doet mee aan de ronde', student, `/games/${code}/players`,
    { method: 'POST', body: { nickname: 'NietMijnNaam' } }, (r) => r.status === 201 && r.data.nickname === studentName)
  await step('S4', 'Gast doet mee zonder account', guest, `/games/${code}/players`, { method: 'POST', body: { nickname: 'Gast' } }, (r) => r.status === 201)
  const reachedPodium = await playRound(teacher, [student, guest], code)
  note('S4', 'Live ronde via Socket.IO gespeeld (student antwoordt goed, gast fout)', reachedPodium,
    reachedPodium ? `Game ${code}: host:start → ${questions.length} vragen → game:podium bereikt.` : 'Podium niet bereikt binnen de tijd.')
  await sleep(1000) // de server slaat de eindstand op na het podium
  await step('S4', 'Na de ronde: gespeeld 1, beste plaats 1, 1× podium', student, '/me/results', {},
    (r) => r.data.summary?.played === 1 && r.data.summary.bestRank === 1 && r.data.summary.podiumCount === 1 && r.data.results?.[0]?.rank === 1)
  await step('S4', 'Een ander account ziet deze ronde niet bij zijn resultaten', admin, '/me/results', {},
    (r) => r.status === 200 && r.data.summary?.played === adminPlayedBefore)
  await step('S4', 'Niet ingelogd → 401', anonymous, '/me/results', {}, (r) => r.status === 401)

  // ---------- S3: wachtwoord vergeten ----------
  console.log('S3 Wachtwoord vergeten')
  await step('S3', 'Onbekend adres → zelfde antwoord (verraadt niets)', anonymous, '/auth/forgot',
    { method: 'POST', body: { email: `bestaat-niet-${STAMP}@student.hu.nl` } }, (r) => r.status === 200 && r.data.ok === true)
  await step('S3', 'Bestaand adres → zelfde antwoord, mail naar Mailpit', anonymous, '/auth/forgot',
    { method: 'POST', body: { email: studentEmail } }, (r) => r.status === 200 && r.data.ok === true)
  const resetLink = await linkFromMailpit(studentEmail, '/wachtwoord-instellen')
  note('S13', 'Resetmail aangekomen in Mailpit', Boolean(resetLink),
    resetLink ? shortLink(resetLink) : `Geen mail in ${MAILPIT} (draait Mailpit?). De rest van S3 wordt overgeslagen.`)
  if (resetLink) {
    const resetToken = new URL(resetLink).searchParams.get('token')
    await step('S3', 'Is de link geldig? (zonder hem te gebruiken)', anonymous, `/auth/password-link?token=${resetToken}`, {},
      (r) => r.status === 200 && r.data.purpose === 'RESET')
    await step('S3', 'Nieuw wachtwoord kiezen via de link', anonymous, '/auth/password',
      { method: 'POST', body: { token: resetToken, password: 'Nieuw12345' } }, (r) => r.status === 200)
    studentPassword = 'Nieuw12345'
    await step('S3', 'Zelfde link nog een keer → ongeldig (eenmalig)', anonymous, '/auth/password',
      { method: 'POST', body: { token: resetToken, password: 'Anders12345' } }, (r) => r.status === 400 && r.data.error === 'LINK_INVALID')
    await step('S3', 'Inloggen met het nieuwe wachtwoord lukt', student, '/auth/login',
      { method: 'POST', body: { email: studentEmail, password: studentPassword } }, (r) => r.status === 200)
  }
  await step('S3', 'Verzonnen token → ongeldig', anonymous, '/auth/password-link?token=verzonnen', {}, (r) => r.status === 400)

  // ---------- S5: profiel en wachtwoord ----------
  console.log('S5 Profiel en wachtwoord')
  await step('S5', 'Vaardigheden aanpassen', student, '/me', { method: 'PATCH', body: { skills: { SD: 4, IOT: 2 } } }, (r) => r.status === 200 && r.data.user)
  await step('S5', 'Ongeldig e-mailadres → 400', student, '/me', { method: 'PATCH', body: { email: 'geen-email' } }, (r) => r.status === 400)
  await step('S5', 'Wachtwoord wijzigen met FOUT huidig wachtwoord → 400', student, '/me/password',
    { method: 'POST', body: { currentPassword: 'Fout12345', newPassword: 'Student456' } }, (r) => r.status === 400 && r.data.error === 'WRONG_PASSWORD')
  await step('S5', 'Wachtwoord wijzigen met goed huidig wachtwoord', student, '/me/password',
    { method: 'POST', body: { currentPassword: studentPassword, newPassword: 'Student456' } }, (r) => r.status === 200)
  studentPassword = 'Student456'
  await step('S5', 'Inloggen met het nieuwe wachtwoord lukt', student, '/auth/login',
    { method: 'POST', body: { email: studentEmail, password: studentPassword } }, (r) => r.status === 200)

  // ---------- S9: apparaten ----------
  console.log('S9 Apparaten')
  await step('S9', 'Zelfde student logt ook in op een iPhone', studentPhone, '/auth/login',
    { method: 'POST', body: { email: studentEmail, password: studentPassword } }, (r) => r.status === 200)
  await step('S9', 'Lijst ingelogde apparaten (labels uit de User-Agent)', student, '/me/sessions', {},
    (r) => r.status === 200 && r.data.sessions?.some((s) => s.current) && r.data.sessions.some((s) => /Telefoon · Safari/.test(s.deviceLabel)))
  await step('S9', 'Overal uitloggen behalve hier', student, '/me/sessions/revoke-others', { method: 'POST' }, (r) => r.status === 200 && r.data.revoked >= 1)
  await step('S9', 'iPhone is nu uitgelogd', studentPhone, '/auth/me', {}, (r) => r.data.user === null)
  await step('S9', 'Laptop is nog ingelogd', student, '/auth/me', {}, (r) => r.data.user?.email === studentEmail)

  // ---------- S12: gebruiker aanpassen of verwijderen ----------
  console.log('S12 Gebruiker aanpassen of verwijderen')
  const teacherId = invite.data.user?.id
  await step('S12', 'Beheerder past naam van de docent aan', admin, `/admin/users/${teacherId}`,
    { method: 'PATCH', body: { username: `Docent${STAMP}B`.slice(0, 20) } }, (r) => r.status === 200)
  await step('S12', 'Beheerder verwijdert zichzelf → geweigerd', admin, `/admin/users/${adminMe.data.user?.id}`,
    { method: 'DELETE' }, (r) => r.status === 409 && r.data.error === 'DELETE_SELF')
  await teacher.request(`/quizzes/${draft.data.quiz?.id}`, { method: 'DELETE' })
  await teacher.request(`/quizzes/${fromDefaults.data.quiz?.id}`, { method: 'DELETE' })
  await teacher.request(`/quizzes/${overridden.data.quiz?.id}`, { method: 'DELETE' })
  await teacher.request(`/quizzes/${ready.data.quiz?.id}`, { method: 'DELETE' })
  await step('S12', 'Beheerder verwijdert de testdocent', admin, `/admin/users/${teacherId}`, { method: 'DELETE' }, (r) => r.status === 200)
  await step('S12', 'Verwijderde gebruiker bestaat niet meer → 404', admin, `/admin/users/${teacherId}`,
    { method: 'PATCH', body: { username: 'Weg' } }, (r) => r.status === 404)

  // ---------- S6: account verwijderen ----------
  console.log('S6 Account verwijderen')
  await step('S6', 'Verwijderen met fout wachtwoord → 400', student, '/me', { method: 'DELETE', body: { password: 'Fout12345' } },
    (r) => r.status === 400 && r.data.error === 'WRONG_PASSWORD')
  await step('S6', 'Verwijderen met goed wachtwoord → cookie gewist', student, '/me', { method: 'DELETE', body: { password: studentPassword } },
    (r) => r.status === 200 && r.setCookies.some((c) => c.startsWith('quiz_auth=;') || /quiz_auth=;|Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c)))
  await step('S6', 'Daarna niet meer ingelogd', student, '/auth/me', {}, (r) => r.data.user === null)
  await step('S6', 'Inloggen met het verwijderde account lukt niet', anonymous, '/auth/login',
    { method: 'POST', body: { email: studentEmail, password: studentPassword } }, (r) => r.status === 401)
  await step('S6', 'De ronde blijft bestaan bij Uitslagen (anoniem)', admin, '/admin/results?q=Visuele', {},
    (r) => r.status === 200 && r.data.rounds?.some((round) => round.code === code))

  await step('S2', 'Beheerder logt uit → cookie gewist', admin, '/auth/logout', { method: 'POST' }, (r) => r.status === 200)
  await step('S2', 'Na uitloggen geen toegang meer', admin, '/admin/users', {}, (r) => r.status === 401)
}

/** Speelt een ronde via Socket.IO, zoals de smoke-test. De eerste speler antwoordt steeds goed. */
async function playRound(host, players, code) {
  try {
    const hostSocket = await connect(host, code, 'host')
    const playerSockets = await Promise.all(players.map((player) => connect(player, code, 'player')))
    let phase = 'LOBBY'
    let questionIndex = 0
    hostSocket.on('question:show', (question) => {
      phase = question.phase
      questionIndex = question.index
    })
    hostSocket.on('question:end', () => (phase = 'QUESTION_RESULT'))
    const podium = new Promise((done) => hostSocket.once('game:podium', () => done(true)))
    await emit(hostSocket, 'host:start')
    for (let i = 0; i < questions.length; i += 1) {
      await sleep(150)
      await emit(hostSocket, 'host:next', { phase, questionIndex })
      await sleep(150)
      const correctId = i === 0 ? 2 : 1
      await emit(playerSockets[0], 'player:answer', { questionIndex: i, optionId: correctId })
      await emit(playerSockets[1], 'player:answer', { questionIndex: i, optionId: correctId === 1 ? 2 : 1 })
      await sleep(200)
      await emit(hostSocket, 'host:next', { phase, questionIndex })
    }
    const result = await Promise.race([podium, sleep(5000).then(() => false)])
    for (const socket of [hostSocket, ...playerSockets]) socket.close()
    return result
  } catch {
    return false
  }
}

// ---------- Rapport (HTML) ----------

const escape = (value) => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char])

/** JSON netjes en kort: lange lijsten en tokens worden ingekort zodat het screenshot leesbaar blijft. */
function pretty(value) {
  const short = JSON.parse(JSON.stringify(value ?? {}, (key, inner) => {
    if (Array.isArray(inner) && inner.length > 4) return [...inner.slice(0, 4), `… nog ${inner.length - 4}`]
    if (typeof inner === 'string' && /token=/.test(inner)) return inner.replace(/token=(.{8}).*/, 'token=$1…')
    if (key === 'token' && typeof inner === 'string') return `${inner.slice(0, 8)}…`
    return inner
  }))
  const lines = JSON.stringify(short, null, 2).split('\n')
  return lines.length > 28 ? [...lines.slice(0, 28), '  …'].join('\n') : lines.join('\n')
}

const cookieSummary = (line) => {
  const [pair, ...flags] = line.split(';').map((part) => part.trim())
  const [name, value] = pair.split('=')
  return `${name}=${value ? `${value.slice(0, 6)}…` : '(gewist)'}; ${flags.filter((f) => !/^(Path|Expires)/i.test(f)).join('; ')}`
}

function statusClass(status) {
  if (status >= 200 && status < 300) return 's2'
  if (status >= 400 && status < 500) return 's4'
  return 's5'
}

function renderStep(item, index) {
  const head = `<div class="step__head"><span class="badge ${item.ok ? 'ok' : 'fail'}">${item.ok ? '✓ geslaagd' : '✗ mislukt'}</span><span class="step__label">${index + 1}. ${escape(item.label)}</span></div>`
  if (item.note) return `<article class="step">${head}<p class="note">${escape(item.note)}</p></article>`
  return `<article class="step">${head}
    <div class="io">
      <div class="io__col">
        <div class="io__title">Verzoek <span class="who">als ${escape(item.name)}</span></div>
        <div class="line"><span class="method m-${item.method}">${item.method}</span><code>/api${escape(item.path)}</code></div>
        ${item.sentCookies?.length ? `<div class="meta">Cookie: ${escape(item.sentCookies.join(', '))}</div>` : '<div class="meta">Geen cookie (niet ingelogd)</div>'}
        ${item.body ? `<pre>${escape(pretty(item.body))}</pre>` : ''}
      </div>
      <div class="io__col">
        <div class="io__title">Antwoord <span class="who">${item.ms ?? 0} ms</span></div>
        <div class="line"><span class="status ${statusClass(item.status)}">${item.status}</span></div>
        ${item.setCookies?.map((c) => `<div class="meta">Set-Cookie: ${escape(cookieSummary(c))}</div>`).join('') ?? ''}
        <pre>${escape(pretty(item.data))}</pre>
      </div>
    </div></article>`
}

function renderStory(key, standalone) {
  const story = STORIES[key]
  const list = steps[key]
  const passed = list.filter((item) => item.ok).length
  const allOk = list.length > 0 && passed === list.length
  return `<section class="story" id="${key}">
    <header class="story__head">
      <div><div class="story__key">${key} · Story ${key.slice(1)}</div><h2>${escape(story.title)}</h2><div class="task">Backend-taak: ${escape(story.task)}</div></div>
      <div class="score ${allOk ? 'ok' : 'fail'}">${passed}/${list.length}</div>
    </header>
    ${list.map(renderStep).join('')}
    ${standalone ? `<footer class="foot">Open ICT Quiz · visuele API-test · ${escape(BASE)} · ${new Date().toLocaleString('nl-NL')}</footer>` : ''}
  </section>`
}

const CSS = `
:root { --bg:#f6f1ea; --card:#fff; --ink:#2b2118; --muted:#7a6a5b; --line:#eadfd2; --accent:#f07c22; --ok:#1f8a4c; --okbg:#e3f5ea; --fail:#c0392b; --failbg:#fbe4e1; --code:#fbf7f2; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:14px/1.45 "Segoe UI", system-ui, sans-serif; }
.wrap { max-width:1100px; margin:0 auto; padding:24px 16px 48px; }
h1 { margin:0 0 4px; font-size:26px; } h2 { margin:2px 0 4px; font-size:20px; }
.sub { color:var(--muted); margin-bottom:18px; }
.summary { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:8px; margin-bottom:24px; }
.summary a { display:flex; justify-content:space-between; gap:8px; padding:10px 12px; background:var(--card); border:1px solid var(--line); border-radius:10px; color:inherit; text-decoration:none; }
.summary a:hover { border-color:var(--accent); }
.story { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px; margin-bottom:22px; }
.story__head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; border-bottom:2px solid var(--accent); padding-bottom:10px; margin-bottom:12px; }
.story__key { color:var(--accent); font-weight:700; font-size:12px; letter-spacing:.06em; text-transform:uppercase; }
.task { color:var(--muted); font-size:13px; }
.score { font-weight:800; font-size:20px; padding:6px 12px; border-radius:10px; white-space:nowrap; }
.score.ok, .badge.ok { background:var(--okbg); color:var(--ok); } .score.fail, .badge.fail { background:var(--failbg); color:var(--fail); }
.step { border:1px solid var(--line); border-radius:10px; padding:10px 12px; margin-top:10px; }
.step__head { display:flex; gap:10px; align-items:center; font-weight:600; }
.badge { font-size:12px; padding:2px 8px; border-radius:999px; white-space:nowrap; align-self:flex-start; }
.io { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px; }
.io__col { min-width:0; }
.io__title { font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); font-weight:700; margin-bottom:4px; }
.who { text-transform:none; letter-spacing:0; font-weight:400; }
.line { display:flex; gap:8px; align-items:center; margin-bottom:4px; }
.line code { font:13px Consolas, monospace; word-break:break-all; }
.method, .status { font:700 12px Consolas, monospace; padding:2px 7px; border-radius:6px; color:#fff; background:#6b5b4b; }
.m-GET { background:#2f80c1; } .m-POST { background:#1f8a4c; } .m-PATCH, .m-PUT { background:#b7791f; } .m-DELETE { background:#c0392b; }
.status.s2 { background:var(--ok); } .status.s4 { background:#d97706; } .status.s5 { background:var(--fail); }
.meta { font:12px Consolas, monospace; color:var(--muted); word-break:break-all; }
pre { margin:6px 0 0; background:var(--code); border:1px solid var(--line); border-radius:8px; padding:8px; font:12px/1.4 Consolas, monospace; white-space:pre-wrap; word-break:break-all; }
.note { margin:6px 0 0; font:13px Consolas, monospace; color:var(--muted); word-break:break-all; }
.foot { margin-top:12px; color:var(--muted); font-size:12px; }
@media (max-width:700px) { .io { grid-template-columns:1fr; } }
`

function page(title, body) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>${CSS}</style></head><body><div class="wrap">${body}</div></body></html>`
}

function writeReport() {
  mkdirSync(join(OUT, 'stories'), { recursive: true })
  const keys = Object.keys(STORIES)
  const total = keys.flatMap((key) => steps[key])
  const passed = total.filter((item) => item.ok).length
  const summary = keys
    .map((key) => {
      const list = steps[key]
      const ok = list.filter((item) => item.ok).length
      return `<a href="#${key}"><span><b>${key}</b> ${escape(STORIES[key].title)}</span><span class="badge ${ok === list.length && list.length ? 'ok' : 'fail'}">${ok}/${list.length}</span></a>`
    })
    .join('')
  const header = `<h1>Visuele API-test sprint 2</h1><div class="sub">${passed}/${total.length} controles geslaagd · tegen ${escape(BASE)} · ${new Date().toLocaleString('nl-NL')} · screenshots per story in <code>screenshots/</code></div>`
  writeFileSync(join(OUT, 'index.html'), page('Visuele API-test', header + `<nav class="summary">${summary}</nav>` + keys.map((key) => renderStory(key, false)).join('')))
  for (const key of keys) writeFileSync(join(OUT, 'stories', `${key}.html`), page(`${key} ${STORIES[key].title}`, renderStory(key, true)))
  writeFileSync(join(OUT, 'stories', 'overzicht.html'), page('Overzicht', header + `<nav class="summary">${summary}</nav>`))
  return { passed, total: total.length }
}

// ---------- Screenshots met Chrome (headless, via het DevTools-protocol) ----------
// Zo meten we hoe lang de pagina is en krijgen we de hele story op één PNG.

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ]
  return candidates.find((path) => path && existsSync(path))
}

async function screenshots() {
  const chrome = findChrome()
  if (!chrome) {
    console.log('\nGeen Chrome/Edge gevonden: alleen het HTML-rapport, geen PNG’s. (Zet CHROME_PATH als hij ergens anders staat.)')
    return []
  }
  const profile = mkdtempSync(join(tmpdir(), 'visual-api-'))
  const port = 9400 + Math.floor(Math.random() * 400)
  const child = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
  try {
    let target
    for (let i = 0; i < 50 && !target; i += 1) {
      await sleep(200)
      target = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).then((list) => list.find((t) => t.type === 'page')).catch(() => null)
    }
    if (!target) throw new Error('Chrome start niet')
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((done) => ws.addEventListener('open', done, { once: true }))
    let id = 0
    const pending = new Map()
    const events = []
    ws.addEventListener('message', (message) => {
      const data = JSON.parse(message.data)
      if (data.id && pending.has(data.id)) pending.get(data.id)(data.result)
      else events.push(data.method)
    })
    const send = (method, params = {}) => new Promise((done) => { id += 1; pending.set(id, done); ws.send(JSON.stringify({ id, method, params })) })

    mkdirSync(join(OUT, 'screenshots'), { recursive: true })
    const files = []
    for (const name of ['overzicht', ...Object.keys(STORIES)]) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1140, height: 800, deviceScaleFactor: 1, mobile: false })
      await send('Page.navigate', { url: pathToFileURL(join(OUT, 'stories', `${name}.html`)).href })
      await sleep(400)
      const { cssContentSize } = await send('Page.getLayoutMetrics')
      const height = Math.ceil(cssContentSize.height)
      await send('Emulation.setDeviceMetricsOverride', { width: 1140, height, deviceScaleFactor: 1, mobile: false })
      const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1140, height, scale: 1 } })
      const file = join(OUT, 'screenshots', `${name}.png`)
      writeFileSync(file, Buffer.from(data, 'base64'))
      files.push(file)
    }
    ws.close()
    return files
  } finally {
    child.kill()
    await sleep(300)
    try { rmSync(profile, { recursive: true, force: true }) } catch { /* Chrome houdt soms nog een bestand vast; tijdelijk mapje, niet erg */ }
  }
}

let crashed = null
try {
  console.log(`Visuele API-test tegen ${BASE}\n`)
  await run()
} catch (error) {
  crashed = error
  console.error('\nTest gestopt door een fout:', error.message)
}
const { passed, total } = writeReport()
const files = await screenshots().catch((error) => {
  console.log('\nScreenshots mislukt:', error.message)
  return []
})
console.log(`\n${passed}/${total} controles geslaagd.`)
console.log(`Rapport:     ${join(OUT, 'index.html')}`)
if (files.length) console.log(`Screenshots: ${join(OUT, 'screenshots')} (${files.length} PNG's)`)
process.exit(crashed || passed !== total ? 1 : 0)
