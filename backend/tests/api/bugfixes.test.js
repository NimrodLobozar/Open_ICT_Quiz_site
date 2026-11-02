import { beforeEach, describe, expect, it } from 'vitest'
import { createOneTimeToken } from '../../auth/oneTimeTokens.js'
import { saveGameResults } from '../../db/gameResults.js'
import { gameManager } from '../../game/GameManager.js'
import { app, browser, loggedIn, makeUser, PASSWORD, prisma, quizInput, resetDatabase } from './helpers.js'

// Tests voor de punten uit docs/bugs_and_Ideas.txt. Per regel uit dat bestand één describe.
beforeEach(resetDatabase)

/** Een docent host een quiz; geeft de gamecode en de Game uit het geheugen terug. */
async function hostGame(input = quizInput()) {
  const { agent: teacher } = await loggedIn({ role: 'TEACHER' })
  const { body } = await teacher.post('/api/quizzes').send(input)
  const { body: created } = await teacher.post('/api/games').send({ quizId: body.quiz.id })
  return { code: created.gameCode, game: gameManager.getGame(created.gameCode), teacher }
}

describe('regel 1: zelfde naam als gast en als account', () => {
  it('een account mag meedoen als een gast al zijn naam heeft, en krijgt het account-icoontje', async () => {
    const { code, game } = await hostGame()
    const guest = await browser().post(`/api/games/${code}/players`).send({ nickname: 'John' })
    expect(guest.status).toBe(201)

    const { agent: john } = await loggedIn({ username: 'John' })
    const account = await john.post(`/api/games/${code}/players`).send({})
    expect(account.status).toBe(201)

    const players = game.getLobbyPlayers()
    expect(players.map((p) => [p.nickname, p.isVerified])).toEqual([
      ['John', false],
      ['John', true],
    ])
  })

  it('een gast mag niet de naam nemen van een account dat al in de lobby zit', async () => {
    const { code } = await hostGame()
    const { agent: john } = await loggedIn({ username: 'John' })
    expect((await john.post(`/api/games/${code}/players`).send({})).status).toBe(201)

    const guest = await browser().post(`/api/games/${code}/players`).send({ nickname: 'john' })
    expect(guest.status).toBe(409)
    expect(guest.body.error).toBe('NAME_TAKEN')
  })
})

describe('regel 2: nieuw wachtwoord gelijk aan het oude', () => {
  it('weigert hetzelfde wachtwoord, en het oude blijft werken', async () => {
    const { user, agent } = await loggedIn()
    const response = await agent.post('/api/me/password').send({ currentPassword: PASSWORD, newPassword: PASSWORD })
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('PASSWORD_SAME')
    const login = await browser().post('/api/auth/login').send({ email: user.email, password: PASSWORD })
    expect(login.status).toBe(200)
  })

  it('een ander wachtwoord mag wel', async () => {
    const { agent } = await loggedIn()
    const response = await agent.post('/api/me/password').send({ currentPassword: PASSWORD, newPassword: 'AnderWacht9' })
    expect(response.status).toBe(200)
  })
})

describe('regel 5: vaardigheden van je account bij het joinen', () => {
  it('stuurt een nieuw account geen vaardigheden mee, dan staan ze op 0 (niet op 5)', async () => {
    const { code, game } = await hostGame()
    const { agent } = await loggedIn()
    const joined = await agent.post(`/api/games/${code}/players`).send({})
    expect(game.getPlayer(joined.body.playerId).skills).toEqual({ SD: 0, AI: 0, TI: 0, CSC: 0, GD: 0, BI: 0 })
  })

  it('gebruikt de opgeslagen vaardigheden van het account', async () => {
    const { code, game } = await hostGame()
    const { user, agent } = await loggedIn()
    await prisma.user.update({ where: { id: user.id }, data: { skills: { SD: 4, AI: 2 } } })
    const joined = await agent.post(`/api/games/${code}/players`).send({})
    expect(game.getPlayer(joined.body.playerId).skills).toMatchObject({ SD: 4, AI: 2, TI: 0 })
  })
})

describe('regel 7: meer antwoorden goed bij een quiz', () => {
  it('een docent bewaart een vraag met twee goede antwoorden, en de game gebruikt ze allebei', async () => {
    const input = quizInput({
      questions: [
        {
          text: 'Welke zijn programmeertalen?',
          options: [
            { text: 'Python', isCorrect: true },
            { text: 'HTML', isCorrect: false },
            { text: 'Java', isCorrect: true },
          ],
        },
      ],
    })
    const { game, teacher } = await hostGame(input)
    const quizId = (await teacher.get('/api/quizzes')).body.quizzes[0].id
    const saved = (await teacher.get(`/api/quizzes/${quizId}`)).body.quiz
    expect(saved.questions[0].options.filter((o) => o.isCorrect)).toHaveLength(2)
    expect(game.questions[0].options.filter((o) => o.isCorrect).map((o) => o.id)).toEqual([1, 3])
  })
})

describe('regel 9-13: vaardigheid en niveau per vraag', () => {
  it('bewaart vaardigheid en niveau, en toont ze na de vraag in de tussenstand', async () => {
    const input = quizInput()
    input.questions[0] = { ...input.questions[0], skill: 'TI', difficulty: 4 }
    const { game, teacher } = await hostGame(input)
    const quizId = (await teacher.get('/api/quizzes')).body.quizzes[0].id
    expect((await teacher.get(`/api/quizzes/${quizId}`)).body.quiz.questions[0]).toMatchObject({ skill: 'TI', difficulty: 4 })

    const a = game.addPlayer('Anna')
    game.addPlayer('Bram')
    game.start(1000)
    game.openAnswers(1000)
    game.submitAnswer(a.id, { questionIndex: 0, optionId: 2 }, 1000)
    game.endQuestion()
    expect(game.getQuestionEndPayload()).toMatchObject({ skill: 'TI', difficulty: 4 })
    // Niveau 4 = ×1,75: direct goed is 1750 punten.
    expect(game.getPlayer(a.id).score).toBe(1750)
  })

  it('weigert een niveau buiten 1 t/m 5', async () => {
    const { agent: teacher } = await loggedIn({ role: 'TEACHER' })
    const input = quizInput()
    input.questions[0] = { ...input.questions[0], difficulty: 6 }
    const response = await teacher.post('/api/quizzes').send(input)
    expect(response.status).toBe(400)
  })
})

describe('regel 18: account maken na de quiz en de score bewaren', () => {
  /** Een gast speelt een ronde mee (in `guest`) tot en met het podium; de eindstand is opgeslagen. */
  async function guestPlays(guest) {
    const { code, game } = await hostGame()
    const joined = await guest.post(`/api/games/${code}/players`).send({ nickname: 'Gastspeler' })
    const other = await browser().post(`/api/games/${code}/players`).send({ nickname: 'Ander' })
    game.recordAnswer(joined.body.playerId, { questionIndex: 0, correct: true, points: 900 })
    game.recordAnswer(other.body.playerId, { questionIndex: 0, correct: false, points: 0 })
    game.finish()
    await saveGameResults(game)
    return { code, game, playerId: joined.body.playerId }
  }

  it('registreren in dezelfde browser koppelt de gast-score aan het nieuwe account', async () => {
    const guest = browser()
    await guestPlays(guest)
    const response = await guest.post('/api/auth/register').send({
      username: 'Nieuweling',
      email: 'nieuweling@student.hu.nl',
      password: 'Welkom123',
      acceptPrivacy: true,
    })
    expect(response.status).toBe(201)
    expect(response.body.claimedResults).toBe(1)

    const row = await prisma.gameResult.findFirst({ where: { nickname: 'Gastspeler' } })
    expect(row.userId).toBe(response.body.user.id)
    expect(row.score).toBe(900)
    // De andere gast blijft een gast.
    expect((await prisma.gameResult.findFirst({ where: { nickname: 'Ander' } })).userId).toBeNull()
  })

  it('inloggen met een bestaand account koppelt de score ook, en het eindscherm noemt je geen gast meer', async () => {
    const guest = browser()
    const { game, playerId } = await guestPlays(guest)
    const { user } = await loggedIn({ username: 'Bestaand', email: 'bestaand@student.hu.nl' })
    const login = await guest.post('/api/auth/login').send({ email: 'bestaand@student.hu.nl', password: PASSWORD })
    expect(login.body.claimedResults).toBe(1)
    expect(game.getPlayerResult(playerId).isGuest).toBe(false)
    const mine = await guest.get('/api/me/results')
    expect(mine.body.total).toBe(1)
    expect(mine.body.results[0]).toMatchObject({ score: 900, rank: 1 })
    expect(user.id).toBe((await prisma.gameResult.findFirst({ where: { nickname: 'Gastspeler' } })).userId)
  })

  it('een andere browser (zonder de speler-cookie) kan de score niet claimen', async () => {
    await guestPlays(browser())
    const response = await browser().post('/api/auth/register').send({
      username: 'Dief',
      email: 'dief@student.hu.nl',
      password: 'Welkom123',
      acceptPrivacy: true,
    })
    expect(response.body.claimedResults).toBe(0)
    expect((await prisma.gameResult.findFirst({ where: { nickname: 'Gastspeler' } })).userId).toBeNull()
  })

  it('een score kan maar één keer geclaimd worden', async () => {
    const guest = browser()
    await guestPlays(guest)
    await loggedIn({ email: 'eerste@student.hu.nl' })
    await loggedIn({ email: 'tweede@student.hu.nl' })
    const first = await guest.post('/api/auth/login').send({ email: 'eerste@student.hu.nl', password: PASSWORD })
    await guest.post('/api/auth/logout')
    const second = await guest.post('/api/auth/login').send({ email: 'tweede@student.hu.nl', password: PASSWORD })
    expect(first.body.claimedResults).toBe(1)
    expect(second.body.claimedResults).toBe(0)
  })
})

describe('review PR #25 (Copilot)', () => {
  it('hoog: een gast claimt alleen zijn eigen rij, niet die van een verwijderd account met dezelfde naam', async () => {
    const { code, game } = await hostGame()
    const guest = browser()
    const asGuest = await guest.post(`/api/games/${code}/players`).send({ nickname: 'John' })
    const { user: john, agent: johnAgent } = await loggedIn({ username: 'John' })
    const asAccount = await johnAgent.post(`/api/games/${code}/players`).send({})
    game.recordAnswer(asGuest.body.playerId, { questionIndex: 0, correct: false, points: 0 })
    game.recordAnswer(asAccount.body.playerId, { questionIndex: 0, correct: true, points: 950 })
    game.finish()
    // Het John-account verdwijnt vóór het opslaan: zijn rij krijgt dan ook userId null, met naam John.
    await prisma.user.delete({ where: { id: john.id } })
    await saveGameResults(game)

    const response = await guest.post('/api/auth/register').send({
      username: 'Gast John',
      email: 'gastjohn@student.hu.nl',
      password: 'Welkom123',
      acceptPrivacy: true,
    })
    expect(response.body.claimedResults).toBe(1)
    const mine = await prisma.gameResult.findMany({ where: { userId: response.body.user.id } })
    expect(mine.map((row) => row.score)).toEqual([0]) // alleen zijn eigen 0, niet de 950 van het account
  })

  it('midden: twee links tegelijk gebruiken geeft geen serverfout, en maar één werkt', async () => {
    const user = await makeUser()
    const first = await createOneTimeToken(user.id, 'RESET')
    const second = await createOneTimeToken(user.id, 'RESET')
    const responses = await Promise.all([
      browser().post('/api/auth/password').send({ token: first, password: 'EersteWacht1' }),
      browser().post('/api/auth/password').send({ token: second, password: 'TweedeWacht2' }),
    ])
    expect(responses.map((r) => r.status).sort()).toEqual([200, 400])
  })

  it('midden: na koppelen kan hetzelfde account niet nog een keer joinen vanuit een andere browser', async () => {
    const { code } = await hostGame()
    const guest = browser()
    await guest.post(`/api/games/${code}/players`).send({ nickname: 'Gastspeler' })
    await loggedIn({ username: 'Emma', email: 'emma2@student.hu.nl' })
    await guest.post('/api/auth/login').send({ email: 'emma2@student.hu.nl', password: PASSWORD })

    const other = browser()
    await other.post('/api/auth/login').send({ email: 'emma2@student.hu.nl', password: PASSWORD })
    const again = await other.post(`/api/games/${code}/players`).send({})
    expect(again.status).toBe(409)
    expect(again.body.error).toBe('ALREADY_JOINED')
  })
})

describe('review PR #25 (Copilot), ronde 2', () => {
  /** Ronde met een gast en (optioneel) een ingelogd account, tot en met opslaan. */
  async function round({ withAccount } = {}) {
    const { code, game } = await hostGame()
    const guest = browser()
    const asGuest = await guest.post(`/api/games/${code}/players`).send({ nickname: 'Gastspeler' })
    const account = withAccount ? await loggedIn(withAccount) : null
    if (account) await account.agent.post(`/api/games/${code}/players`).send({})
    else await browser().post(`/api/games/${code}/players`).send({ nickname: 'Ander' })
    game.recordAnswer(asGuest.body.playerId, { questionIndex: 0, correct: true, points: 900 })
    game.finish()
    await saveGameResults(game)
    return { code, game, guest, guestId: asGuest.body.playerId, account }
  }

  it('geen tweede uitslag als het account zelf al meespeelde', async () => {
    const { guest, account } = await round({ withAccount: { email: 'zelf@student.hu.nl' } })
    const login = await guest.post('/api/auth/login').send({ email: 'zelf@student.hu.nl', password: PASSWORD })
    expect(login.body.claimedResults).toBe(0)
    expect(await prisma.gameResult.count({ where: { userId: account.user.id } })).toBe(1)
  })

  it('twee logins tegelijk met dezelfde speler-cookie: opgeslagen en live uitslag bij hetzelfde account', async () => {
    const { game, guest, guestId } = await round()
    const a = await makeUser({ email: 'a@student.hu.nl' })
    const b = await makeUser({ email: 'b@student.hu.nl' })
    const [ra, rb] = await Promise.all([
      guest.post('/api/auth/login').send({ email: 'a@student.hu.nl', password: PASSWORD }),
      guest.post('/api/auth/login').send({ email: 'b@student.hu.nl', password: PASSWORD }),
    ])
    expect(ra.body.claimedResults + rb.body.claimedResults).toBe(1)
    const stored = await prisma.gameResult.findFirst({ where: { nickname: 'Gastspeler' } })
    expect([a.id, b.id]).toContain(stored.userId)
    expect(game.getPlayer(guestId).userId).toBe(stored.userId)
  })

  it('na koppelen op het podium krijgt iedereen de nieuwe eindstand (naam + icoontje)', async () => {
    const { guest, guestId } = await round()
    await makeUser({ username: 'Nieuw', email: 'nieuw@student.hu.nl' })
    const sent = []
    const recorder = { to: () => ({ emit: (event, data) => sent.push({ event, data }) }) }
    const previous = app.get('io')
    app.set('io', recorder)
    try {
      await guest.post('/api/auth/login').send({ email: 'nieuw@student.hu.nl', password: PASSWORD })
    } finally {
      app.set('io', previous)
    }
    const podium = sent.find((message) => message.event === 'game:podium')
    expect(podium).toBeDefined()
    expect(podium.data.ranking.find((row) => row.id === guestId)).toMatchObject({ nickname: 'Nieuw', isVerified: true })
  })
})
