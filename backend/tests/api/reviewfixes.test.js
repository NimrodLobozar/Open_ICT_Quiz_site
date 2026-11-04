import { beforeEach, describe, expect, it } from 'vitest'
import { saveGameResults } from '../../db/gameResults.js'
import { gameManager } from '../../game/GameManager.js'
import { browser, loggedIn, outbox, PASSWORD, prisma, quizInput, resetDatabase, tokenFromMail } from './helpers.js'

// Bevindingen uit de Copilot-review van PR #30. Elke test laat zien dat het lek of de fout dicht is.
beforeEach(resetDatabase)

/** Docent host een quiz; de browsers doen mee. Geeft de game terug, nog niet afgelopen. */
async function startGame(players) {
  const { agent: teacher } = await loggedIn({ role: 'TEACHER' })
  const { body } = await teacher.post('/api/quizzes').send(quizInput({ title: 'Webtechniek' }))
  const { body: created } = await teacher.post('/api/games').send({ quizId: body.quiz.id })
  const game = gameManager.getGame(created.gameCode)
  const ids = []
  for (const { agent, nickname } of players) {
    const joined = await agent.post(`/api/games/${created.gameCode}/players`).send({ nickname, skills: { SD: 3 } })
    if (joined.status !== 201) throw new Error(JSON.stringify(joined.body))
    ids.push(joined.body.playerId)
  }
  return { game, ids, teacher, quizId: body.quiz.id }
}

describe('leaderboard', () => {
  it('alleen voor ingelogde gebruikers, en niet in de browsercache', async () => {
    expect((await browser().get('/api/leaderboard')).status).toBe(401)
    const { agent } = await loggedIn()
    const response = await agent.get('/api/leaderboard')
    expect(response.status).toBe(200)
    expect(response.headers['cache-control']).toContain('no-store')
  })
})

describe('e-mailadres wijzigen', () => {
  it('weigert email: null netjes met 400 in plaats van een serverfout', async () => {
    const { agent } = await loggedIn()
    const response = await agent.patch('/api/me').send({ email: null })
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('EMAIL_INVALID')
  })

  it('een nieuw adres telt pas na bevestigen: zo kun je het adres van een ander niet bezetten', async () => {
    const { user, agent } = await loggedIn({ email: 'jan@student.hu.nl' })
    const changed = await agent.patch('/api/me').send({ email: 'emma@student.hu.nl' })
    expect(changed.body.user).toMatchObject({ email: 'jan@student.hu.nl', pendingEmail: 'emma@student.hu.nl' })
    // Jans link nu al pakken: na Emma's registratie gaat er nog een mail naar hetzelfde adres.
    const janToken = await tokenFromMail('emma@student.hu.nl', 'email-bevestigen')
    expect(janToken).toBeTruthy()

    // De echte Emma kan zich gewoon registreren met haar eigen adres.
    const registered = await browser()
      .post('/api/auth/register')
      .send({ username: 'Emma', email: 'emma@student.hu.nl', password: PASSWORD, acceptPrivacy: true })
    expect(registered.status).toBe(201)

    // Jan krijgt haar adres daarna niet meer, ook niet met de link uit de mail.
    const verify = await agent.post('/api/auth/verify-email').send({ token: janToken })
    expect(verify.status).toBe(400)
    const jan = await prisma.user.findUnique({ where: { id: user.id } })
    expect(jan).toMatchObject({ email: 'jan@student.hu.nl', pendingEmail: null })
    // En Jan logt nog gewoon in met zijn eigen adres.
    expect((await browser().post('/api/auth/login').send({ email: 'jan@student.hu.nl', password: PASSWORD })).status).toBe(200)
  })

  it('alleen je naam opslaan laat een openstaande wijziging (en de link in de mail) staan', async () => {
    const { agent } = await loggedIn({ email: 'jan@student.hu.nl' })
    await agent.patch('/api/me').send({ email: 'nieuw@student.hu.nl' })
    const token = await tokenFromMail('nieuw@student.hu.nl', 'email-bevestigen')

    // Instellingen toont het wachtende adres in het veld en stuurt het mee.
    const renamed = await agent.patch('/api/me').send({ username: 'Jan B', email: 'nieuw@student.hu.nl' })
    expect(renamed.body.user).toMatchObject({ email: 'jan@student.hu.nl', pendingEmail: 'nieuw@student.hu.nl' })

    expect((await agent.post('/api/auth/verify-email').send({ token })).status).toBe(200)
    expect((await agent.get('/api/auth/me')).body.user.email).toBe('nieuw@student.hu.nl')
  })

  it('een oude link bevestigt nooit een later gekozen adres', async () => {
    const { agent } = await loggedIn({ email: 'jan@student.hu.nl' })
    await agent.patch('/api/me').send({ email: 'eerste@student.hu.nl' })
    const oldToken = await tokenFromMail('eerste@student.hu.nl', 'email-bevestigen')
    await agent.patch('/api/me').send({ email: 'tweede@student.hu.nl' })

    expect((await agent.post('/api/auth/verify-email').send({ token: oldToken })).status).toBe(400)
    expect((await agent.get('/api/auth/me')).body.user.email).toBe('jan@student.hu.nl')
  })

  it('de mail voor het wachtende adres kun je opnieuw laten sturen', async () => {
    const { agent } = await loggedIn({ email: 'jan@student.hu.nl' })
    expect((await agent.post('/api/me/email/resend')).body.error).toBe('NO_PENDING_EMAIL')

    await agent.patch('/api/me').send({ email: 'nieuw@student.hu.nl' })
    // De eerste mail gaat op de achtergrond; eerst wachten tot hij er is, anders klopt de telling niet.
    await tokenFromMail('nieuw@student.hu.nl', 'email-bevestigen')
    const before = outbox.filter((mail) => mail.to === 'nieuw@student.hu.nl').length
    expect((await agent.post('/api/me/email/resend')).status).toBe(200)
    expect(outbox.filter((mail) => mail.to === 'nieuw@student.hu.nl').length).toBe(before + 1)

    const token = await tokenFromMail('nieuw@student.hu.nl', 'email-bevestigen')
    expect((await agent.post('/api/auth/verify-email').send({ token })).status).toBe(200)
    expect((await agent.get('/api/auth/me')).body.user.email).toBe('nieuw@student.hu.nl')
  })

  it('maximaal 5 bevestigingsmails per kwartier; gewoon je naam opslaan telt niet mee', async () => {
    const { agent } = await loggedIn({ email: 'jan@student.hu.nl' })
    for (let i = 1; i <= 5; i += 1) {
      // Om en om een nieuw adres en het huidige: zo zou je anders onbeperkt mails kunnen laten sturen.
      expect((await agent.patch('/api/me').send({ email: `nieuw${i}@student.hu.nl` })).status).toBe(200)
      expect((await agent.patch('/api/me').send({ email: 'jan@student.hu.nl' })).status).toBe(200)
    }
    expect((await agent.patch('/api/me').send({ email: 'nieuw6@student.hu.nl' })).status).toBe(429)
    expect((await agent.post('/api/me/email/resend')).status).toBe(429)
    // Naam wijzigen gaat gewoon door.
    expect((await agent.patch('/api/me').send({ username: 'Jan B', email: 'jan@student.hu.nl' })).status).toBe(200)
  })

  it('terug naar het huidige adres annuleert de openstaande wijziging', async () => {
    const { agent } = await loggedIn({ email: 'jan@student.hu.nl' })
    await agent.patch('/api/me').send({ email: 'nieuw@student.hu.nl' })
    const back = await agent.patch('/api/me').send({ email: 'jan@student.hu.nl' })
    expect(back.body.user.pendingEmail).toBeNull()
  })
})

describe('wachtwoord wijzigen', () => {
  it('maakt openstaande "wachtwoord vergeten"-links ongeldig', async () => {
    const { agent } = await loggedIn({ email: 'jan@student.hu.nl' })
    await browser().post('/api/auth/forgot').send({ email: 'jan@student.hu.nl' })
    const resetToken = await tokenFromMail('jan@student.hu.nl', 'wachtwoord-instellen')
    expect(resetToken).toBeTruthy()

    const changed = await agent.post('/api/me/password').send({ currentPassword: PASSWORD, newPassword: 'Nieuw12345' })
    expect(changed.status).toBe(200)

    // Met de oude link kan niemand het nieuwe wachtwoord meer overschrijven.
    const reset = await browser().post('/api/auth/password').send({ token: resetToken, password: 'Indringer123' })
    expect(reset.status).toBe(400)
    expect((await browser().post('/api/auth/login').send({ email: 'jan@student.hu.nl', password: 'Nieuw12345' })).status).toBe(200)
  })
})

describe('uitslagen opslaan', () => {
  it('account verwijderd tijdens de ronde: geen naam of vaardigheden opnieuw opgeslagen', async () => {
    const { agent: emma } = await loggedIn({ username: 'Emma' })
    const { game, ids } = await startGame([{ agent: emma }, { agent: browser(), nickname: 'Bram' }])
    game.recordAnswer(ids[0], { questionIndex: 0, correct: true, points: 900 })

    expect((await emma.delete('/api/me').send({ password: PASSWORD })).status).toBe(200)
    game.finish()
    await saveGameResults(game)

    const rows = await prisma.gameResult.findMany({ orderBy: { rank: 'asc' } })
    expect(rows.map((row) => [row.nickname, row.userId])).toEqual([
      ['Verwijderde speler', null],
      ['Bram', null], // een echte gast houdt zijn naam
    ])
    expect(rows[0].skills).toEqual({})
    expect(rows[1].skills).toMatchObject({ SD: 3 })
  })

  it('quiz verwijderd tijdens de ronde: de uitslag wordt toch opgeslagen, zonder koppeling', async () => {
    const { game, teacher, quizId } = await startGame([
      { agent: browser(), nickname: 'Bram' },
      { agent: browser(), nickname: 'Lisa' },
    ])
    expect((await teacher.delete(`/api/quizzes/${quizId}`)).status).toBe(200)
    game.finish()
    const session = await saveGameResults(game)

    expect(session).toMatchObject({ quizId: null, quizTitle: 'Webtechniek' })
    expect(await prisma.gameResult.count()).toBe(2)
  })

  it('een gast-score gaat niet naar een account dat zelf al in dezelfde game zit', async () => {
    const { user, agent: emma } = await loggedIn({ username: 'Emma', email: 'emma@student.hu.nl' })
    const guestBrowser = browser()
    const { game } = await startGame([{ agent: emma }, { agent: guestBrowser, nickname: 'Emma2' }])
    game.finish()
    await saveGameResults(game)

    // Dezelfde persoon logt in de gast-browser in met het account dat al meespeelde.
    const login = await guestBrowser.post('/api/auth/login').send({ email: 'emma@student.hu.nl', password: PASSWORD })
    expect(login.body.claimedResults).toBe(0)
    expect(await prisma.gameResult.count({ where: { userId: user.id } })).toBe(1)
  })

  it('twee gast-browsers die tegelijk inloggen, koppelen samen maar één uitslag per ronde', async () => {
    const { user } = await loggedIn({ username: 'Emma', email: 'emma@student.hu.nl' })
    const first = browser()
    const second = browser()
    const { game } = await startGame([
      { agent: first, nickname: 'Gast1' },
      { agent: second, nickname: 'Gast2' },
    ])
    game.finish()
    await saveGameResults(game)

    const credentials = { email: 'emma@student.hu.nl', password: PASSWORD }
    const [a, b] = await Promise.all([
      first.post('/api/auth/login').send(credentials),
      second.post('/api/auth/login').send(credentials),
    ])
    expect(a.body.claimedResults + b.body.claimedResults).toBe(1)
    expect(await prisma.gameResult.count({ where: { userId: user.id } })).toBe(1)
  })

  it('account verwijderd terwijl de eindstand wordt opgeslagen: de rij is toch anoniem', async () => {
    const { agent: emma } = await loggedIn({ username: 'Emma' })
    const { game } = await startGame([{ agent: emma }, { agent: browser(), nickname: 'Bram' }])
    game.finish()
    // Tegelijk: opslaan en verwijderen. Welke ook eerst is, de naam mag niet blijven staan.
    await Promise.all([saveGameResults(game), emma.delete('/api/me').send({ password: PASSWORD })])

    const rows = await prisma.gameResult.findMany()
    expect(rows.some((row) => row.nickname === 'Emma')).toBe(false)
    expect(rows.every((row) => row.userId === null)).toBe(true)
  })
})
