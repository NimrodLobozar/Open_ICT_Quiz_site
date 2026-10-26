// Rooktest: speelt de hele sprint-2-flow na tegen een DRAAIENDE site, net als een browser:
// beheerder → docent uitnodigen → docent maakt quiz → student registreert → live ronde via Socket.IO
// → uitslag op Mijn account en bij Uitslagen → uitloggen → opruimen.
//
// Gebruik (Docker moet draaien):
//   npm run test:smoke                                  (tegen http://localhost:5173, via de Vite-proxy)
//   SMOKE_URL=https://quiz.example.nl npm run test:smoke   (tegen een online omgeving)
// Inloggen als beheerder met SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD (standaard de dev-beheerder uit docker-compose.yml).
//
// Let op: dit maakt echte rijen in de database van die omgeving. Accounts en de quiz worden aan het eind weer
// verwijderd; de gespeelde ronde blijft (anoniem) staan bij Uitslagen, met de titel "Rooktest".
import { io } from 'socket.io-client'

const BASE = (process.env.SMOKE_URL ?? 'http://localhost:5173').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'beheerder@quiz.local'
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'Beheerder123'
const STAMP = Date.now().toString(36)

let failures = 0
function check(condition, label, detail = '') {
  console.log(`${condition ? '  ✓' : '  ✗'} ${label}${!condition && detail ? `  →  ${detail}` : ''}`)
  if (!condition) failures += 1
  return condition
}

/** Een "browser" met eigen cookies. */
function browser() {
  const cookies = new Map()
  async function request(path, { method = 'GET', body } = {}) {
    const response = await fetch(`${BASE}/api${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; '),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    for (const line of response.headers.getSetCookie()) {
      const [pair] = line.split(';')
      const [name, value] = pair.split('=')
      if (value) cookies.set(name, value)
      else cookies.delete(name)
    }
    const data = await response.json().catch(() => ({}))
    return { status: response.status, data, headers: response.headers }
  }
  return { request, cookieHeader: () => [...cookies].map(([n, v]) => `${n}=${v}`).join('; '), cookies }
}

function connect(agent, code, role) {
  return new Promise((resolve, reject) => {
    const socket = io(BASE, {
      transports: ['websocket'],
      extraHeaders: { Cookie: agent.cookieHeader() },
      auth: { code, role },
      reconnection: false,
    })
    socket.once('connect', () => resolve(socket))
    socket.once('connect_error', reject)
  })
}

const emit = (socket, event, payload) =>
  new Promise((resolve) => socket.timeout(5000).emit(event, payload, (error, ack) => resolve(error ? { ok: false, message: 'timeout' } : ack)))
const waitFor = (socket, event) => new Promise((resolve) => socket.once(event, resolve))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  console.log(`Rooktest tegen ${BASE}\n`)

  console.log('1. Server bereikbaar')
  const health = await browser().request('/health')
  if (!check(health.status === 200, 'GET /api/health', `status ${health.status}`)) return

  console.log('2. Beheerder nodigt een docent uit (story 11)')
  const admin = browser()
  const adminLogin = await admin.request('/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  if (!check(adminLogin.status === 200 && adminLogin.data.user?.role === 'ADMIN', 'beheerder logt in', JSON.stringify(adminLogin.data))) return
  check(adminLogin.headers.get('cache-control') === 'no-store', 'antwoord met persoonsgegevens wordt niet gecachet')
  const teacherEmail = `docent-${STAMP}@rooktest.nl`
  const invite = await admin.request('/admin/users', { method: 'POST', body: { username: `Docent ${STAMP}`, email: teacherEmail } })
  check(invite.status === 201 && invite.data.inviteLink, 'docent aangemaakt met uitnodigingslink', JSON.stringify(invite.data))
  const token = new URL(invite.data.inviteLink).searchParams.get('token')
  const activate = await browser().request('/auth/password', { method: 'POST', body: { token, password: 'Docent123' } })
  check(activate.status === 200, 'docent kiest zelf een wachtwoord via de link')
  const reuse = await browser().request('/auth/password', { method: 'POST', body: { token, password: 'Docent456' } })
  check(reuse.status === 400, 'de link werkt maar één keer')

  console.log('3. Docent maakt een quiz (story 7 en 8)')
  const teacher = browser()
  const teacherLogin = await teacher.request('/auth/login', { method: 'POST', body: { email: teacherEmail, password: 'Docent123' } })
  check(teacherLogin.data.user?.role === 'TEACHER', 'docent logt in')
  await teacher.request('/me/quiz-defaults', { method: 'PUT', body: { timePerQuestion: 30, showCorrectAnswer: true, showStandings: true, lockLobbyOnStart: true } })
  const questions = [
    { text: 'Hoeveel bits zitten er in een byte?', options: [{ text: '4' }, { text: '8', isCorrect: true }] },
    { text: 'Waar staat HTML voor?', options: [{ text: 'HyperText Markup Language', isCorrect: true }, { text: 'Home Tool Markup Language' }] },
  ]
  const draft = await teacher.request('/quizzes', { method: 'POST', body: { title: 'Rooktest concept', status: 'DRAFT', questions } })
  const ready = await teacher.request('/quizzes', { method: 'POST', body: { title: 'Rooktest', status: 'READY', questions } })
  check(ready.status === 201 && ready.data.quiz.questions[0].timeLimitSec === 30, 'quiz neemt de standaardtijd van de docent over')
  const draftHost = await teacher.request('/games', { method: 'POST', body: { quizId: draft.data.quiz.id } })
  check(draftHost.status === 409, 'concept-quiz kan niet gehost worden')

  console.log('4. Student maakt een account (story 1)')
  const student = browser()
  const studentEmail = `student-${STAMP}@rooktest.nl`
  const register = await student.request('/auth/register', {
    method: 'POST',
    body: { username: `Emma${STAMP}`.slice(0, 20), email: studentEmail, password: 'Student123', acceptPrivacy: true },
  })
  check(register.status === 201 && register.data.user.role === 'STUDENT', 'registreren lukt en geeft rol STUDENT', JSON.stringify(register.data))
  check(student.cookies.has('quiz_auth'), 'na registreren meteen ingelogd (cookie gezet)')
  const empty = await student.request('/me/results')
  check(empty.data.summary?.played === 0, 'lege staat op Mijn account')
  const studentHost = await student.request('/games', { method: 'POST', body: { quizId: ready.data.quiz.id } })
  check(studentHost.status === 403, 'een student kan niet hosten')

  console.log('5. Live ronde via Socket.IO (via de proxy, zoals in de klas)')
  const created = await teacher.request('/games', { method: 'POST', body: { quizId: ready.data.quiz.id } })
  const code = created.data.gameCode
  check(created.status === 201 && /^\d{6}$/.test(code), `game ${code} aangemaakt`)
  const guest = browser()
  const joinStudent = await student.request(`/games/${code}/players`, { method: 'POST', body: { nickname: 'NietMijnNaam', skills: { SD: 3 } } })
  const joinGuest = await guest.request(`/games/${code}/players`, { method: 'POST', body: { nickname: 'Gast' } })
  check(joinStudent.data.nickname === register.data.user.username, 'ingelogde speler speelt onder zijn accountnaam')
  check(joinGuest.status === 201, 'gast kan nog steeds zonder account meedoen')

  const host = await connect(teacher, code, 'host')
  const players = [await connect(student, code, 'player'), await connect(guest, code, 'player')]
  check(true, 'host en spelers verbonden via WebSocket')

  let phase = 'LOBBY'
  let questionIndex = 0
  host.on('question:show', (q) => {
    phase = q.phase
    questionIndex = q.index
  })
  host.on('question:end', () => (phase = 'QUESTION_RESULT'))
  const podium = waitFor(host, 'game:podium')

  check((await emit(host, 'host:start')).ok, 'host start de quiz')
  for (let i = 0; i < questions.length; i += 1) {
    await sleep(150)
    await emit(host, 'host:next', { phase, questionIndex }) // leestijd overslaan
    await sleep(150)
    // Student antwoordt goed (id 2 bij vraag 1, id 1 bij vraag 2), gast fout.
    const correctId = i === 0 ? 2 : 1
    const ack = await emit(players[0], 'player:answer', { questionIndex: i, optionId: correctId })
    await emit(players[1], 'player:answer', { questionIndex: i, optionId: correctId === 1 ? 2 : 1 })
    check(ack.ok, `vraag ${i + 1} beantwoord`, JSON.stringify(ack))
    await sleep(200) // iedereen heeft geantwoord: de server stopt de vraag zelf
    await emit(host, 'host:next', { phase, questionIndex }) // volgende vraag of podium
  }
  const result = await Promise.race([podium, sleep(5000).then(() => null)])
  check(result !== null, 'podium bereikt')
  for (const socket of [host, ...players]) socket.close()

  console.log('6. Uitslag terugzien (story 4) en bij Uitslagen (docent)')
  await sleep(1000) // de server slaat de eindstand op na het podium
  const mine = await student.request('/me/results')
  check(mine.data.summary?.played === 1 && mine.data.results?.[0]?.rank === 1, 'student ziet zijn ronde met plaats 1', JSON.stringify(mine.data))
  const rounds = await teacher.request('/admin/results')
  const round = rounds.data.rounds?.find((r) => r.code === code)
  check(round?.winner === register.data.user.username, 'docent ziet de ronde met de juiste winnaar', JSON.stringify(rounds.data.rounds?.[0]))

  console.log('7. Uitloggen (story 2)')
  await student.request('/auth/logout', { method: 'POST' })
  check((await student.request('/me/results')).status === 401, 'na uitloggen geen toegang meer')

  console.log('8. Opruimen')
  await student.request('/auth/login', { method: 'POST', body: { email: studentEmail, password: 'Student123' } })
  check((await student.request('/me', { method: 'DELETE', body: { password: 'Student123' } })).status === 200, 'student verwijdert zijn account (story 6)')
  await teacher.request(`/quizzes/${draft.data.quiz.id}`, { method: 'DELETE' })
  await teacher.request(`/quizzes/${ready.data.quiz.id}`, { method: 'DELETE' })
  check((await admin.request(`/admin/users/${invite.data.user.id}`, { method: 'DELETE' })).status === 200, 'beheerder verwijdert de testdocent (story 12)')
  await admin.request('/auth/logout', { method: 'POST' })
}

main()
  .catch((error) => {
    failures += 1
    console.error('\nRooktest gestopt door een fout:', error)
  })
  .finally(() => {
    console.log(failures === 0 ? '\nAlles werkt. ✓' : `\n${failures} controle(s) mislukt. ✗`)
    process.exit(failures === 0 ? 0 : 1)
  })
