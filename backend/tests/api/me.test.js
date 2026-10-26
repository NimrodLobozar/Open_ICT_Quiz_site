import { beforeEach, describe, expect, it } from 'vitest'
import { saveGameResults } from '../../db/gameResults.js'
import { gameManager } from '../../game/GameManager.js'
import { getRanking } from '../../../src/utils/ranking.js'
import { browser, loggedIn, PASSWORD, prisma, quizInput, resetDatabase } from './helpers.js'

// Story 4 (eigen resultaten), 5 (profiel), 6 (account verwijderen) en 9 (apparaten).
beforeEach(resetDatabase)

/** Speelt een hele ronde: docent host, de gegeven browsers doen mee, `points` bepaalt de eindstand. */
async function playRound(players) {
  const { agent: teacher } = await loggedIn({ role: 'TEACHER' })
  const { body } = await teacher.post('/api/quizzes').send(quizInput({ title: 'Webtechniek · week 6' }))
  const { body: created } = await teacher.post('/api/games').send({ quizId: body.quiz.id })
  const game = gameManager.getGame(created.gameCode)

  for (const { agent, nickname, points } of players) {
    const joined = await agent.post(`/api/games/${created.gameCode}/players`).send({ nickname, skills: { SD: 3 } })
    if (joined.status !== 201) throw new Error(JSON.stringify(joined.body))
    game.recordAnswer(joined.body.playerId, { questionIndex: 0, correct: points > 0, points })
  }
  game.finish()
  await saveGameResults(game)
  return { game, code: created.gameCode }
}

describe('eigen resultaten (story 4)', () => {
  it('een nieuwe speler krijgt een lege staat in plaats van een fout', async () => {
    const { agent } = await loggedIn()
    const response = await agent.get('/api/me/results')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      summary: { played: 0, bestRank: null, podiumCount: 0, correctPercent: null },
      total: 0,
      results: [],
    })
  })

  it('ingelogd meedoen koppelt de uitslag aan je account, met dezelfde plaats als de eindstand', async () => {
    const { user, agent: emma } = await loggedIn({ username: 'Emma' })
    const { game } = await playRound([
      { agent: browser(), nickname: 'Gast', points: 900 },
      { agent: emma, nickname: 'NegeerMij', points: 500 },
      { agent: browser(), nickname: 'Bram', points: 500 },
    ])

    // Ingelogd = je accountnaam, niet wat je in het formulier typt, en het account-icoontje.
    const player = [...game.players.values()].find((p) => p.userId === user.id)
    expect(player).toMatchObject({ nickname: 'Emma', isVerified: true })

    const response = await emma.get('/api/me/results')
    expect(response.body.summary).toEqual({ played: 1, bestRank: 2, podiumCount: 1, correctPercent: 100 })
    expect(response.body.results[0]).toMatchObject({
      quizTitle: 'Webtechniek · week 6',
      rank: 2,
      score: 500,
      playerCount: 3,
      questionCount: 1,
    })
    // Zelfde plaats als getRanking (Bram en Emma delen plaats 2).
    const ranking = getRanking([...game.players.values()])
    expect(ranking.find((p) => p.nickname === 'Emma').rank).toBe(response.body.results[0].rank)
  })

  it('een andere gebruiker ziet jouw resultaten niet', async () => {
    const { agent: emma } = await loggedIn()
    const { agent: other } = await loggedIn()
    await playRound([
      { agent: emma, points: 900 },
      { agent: browser(), nickname: 'Gast', points: 100 },
    ])
    expect((await other.get('/api/me/results')).body.total).toBe(0)
    expect((await emma.get('/api/me/results')).body.total).toBe(1)
  })

  it('gasten zonder account kunnen nog steeds meedoen (story 2)', async () => {
    const { game } = await playRound([
      { agent: browser(), nickname: 'Gast1', points: 100 },
      { agent: browser(), nickname: 'Gast2', points: 200 },
    ])
    expect([...game.players.values()].every((p) => p.userId === null && !p.isVerified)).toBe(true)
    expect(await prisma.gameResult.count()).toBe(2)
  })

  it('toont standaard de laatste 5 rondes, en met ?all=1 alles', async () => {
    const { agent } = await loggedIn()
    for (let i = 0; i < 6; i += 1) {
      await playRound([
        { agent, points: 100 },
        { agent: browser(), nickname: `G${i}`, points: 0 },
      ])
    }
    expect((await agent.get('/api/me/results')).body.results).toHaveLength(5)
    expect((await agent.get('/api/me/results').query({ all: '1' })).body.results).toHaveLength(6)
  })
})

describe('profiel en wachtwoord (story 5)', () => {
  it('past naam, e-mailadres en vaardigheden aan; onbekende vaardigheden vallen weg', async () => {
    const { agent } = await loggedIn()
    const response = await agent
      .patch('/api/me')
      .send({ username: 'Nieuwe Naam', email: 'NIEUW@test.nl', skills: { SD: 4, AI: 9, Hack: 3, GD: 0 } })
    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({ username: 'Nieuwe Naam', email: 'nieuw@test.nl', skills: { SD: 4, GD: 0 } })
    expect((await agent.get('/api/auth/me')).body.user.username).toBe('Nieuwe Naam')
  })

  it('weigert een e-mailadres of naam van iemand anders', async () => {
    const { user: other } = await loggedIn({ username: 'Bezet' })
    const { agent } = await loggedIn()
    expect((await agent.patch('/api/me').send({ email: other.email })).body.error).toBe('EMAIL_TAKEN')
    expect((await agent.patch('/api/me').send({ username: 'bezet' })).body.error).toBe('USERNAME_TAKEN')
  })

  it('weigert een nieuw wachtwoord als het huidige niet klopt', async () => {
    const { agent } = await loggedIn()
    const response = await agent.post('/api/me/password').send({ currentPassword: 'Fout1234', newPassword: 'NieuwWacht8' })
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('WRONG_PASSWORD')
  })

  it('wijzigt het wachtwoord en logt andere apparaten uit, dit apparaat niet', async () => {
    const { user, agent: laptop } = await loggedIn()
    const phone = browser()
    await phone.post('/api/auth/login').send({ email: user.email, password: PASSWORD })

    const response = await laptop.post('/api/me/password').send({ currentPassword: PASSWORD, newPassword: 'NieuwWacht8' })
    expect(response.status).toBe(200)
    expect((await laptop.get('/api/auth/me')).body.user).not.toBeNull()
    expect((await phone.get('/api/auth/me')).body.user).toBeNull()
    expect((await browser().post('/api/auth/login').send({ email: user.email, password: 'NieuwWacht8' })).status).toBe(200)
  })

  it('blokkeert na 10 foute pogingen met het huidige wachtwoord (429)', async () => {
    const { agent } = await loggedIn()
    for (let i = 0; i < 10; i += 1) {
      await agent.post('/api/me/password').send({ currentPassword: `Fout${i}abc`, newPassword: 'NieuwWacht8' })
    }
    const blocked = await agent.post('/api/me/password').send({ currentPassword: PASSWORD, newPassword: 'NieuwWacht8' })
    expect(blocked.status).toBe(429)
  })

  it('weigert een zwak nieuw wachtwoord', async () => {
    const { agent } = await loggedIn()
    const response = await agent.post('/api/me/password').send({ currentPassword: PASSWORD, newPassword: 'kort' })
    expect(response.body.error).toBe('PASSWORD_WEAK')
  })
})

describe('account verwijderen (story 6)', () => {
  it('vraagt het wachtwoord als bevestiging', async () => {
    const { user, agent } = await loggedIn()
    expect((await agent.delete('/api/me').send({ password: 'Fout1234' })).status).toBe(400)
    expect((await agent.delete('/api/me')).status).toBe(400)
    expect(await prisma.user.findUnique({ where: { id: user.id } })).not.toBeNull()
  })

  it('wist het account, logt uit, en de eindstand van anderen blijft kloppen', async () => {
    const { user, agent: emma } = await loggedIn({ username: 'Emma' })
    await playRound([
      { agent: emma, points: 900 },
      { agent: browser(), nickname: 'Bram', points: 500 },
    ])

    const response = await emma.delete('/api/me').send({ password: PASSWORD })
    expect(response.status).toBe(200)
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull()
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0)
    expect((await emma.get('/api/auth/me')).body.user).toBeNull()

    const results = await prisma.gameResult.findMany({ orderBy: { rank: 'asc' } })
    expect(results.map((r) => [r.nickname, r.rank])).toEqual([
      ['Verwijderde speler', 1],
      ['Bram', 2],
    ])
    expect(results.some((r) => r.nickname === 'Emma')).toBe(false)
  })
})

describe('ingelogde apparaten (story 9)', () => {
  it('toont de apparaten met het huidige gemarkeerd, zonder IP-adres', async () => {
    const { user, agent: laptop } = await loggedIn()
    await browser()
      .post('/api/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1')
      .send({ email: user.email, password: PASSWORD })

    const response = await laptop.get('/api/me/sessions')
    expect(response.body.sessions).toHaveLength(2)
    expect(response.body.sessions.filter((s) => s.current)).toHaveLength(1)
    expect(response.body.sessions.map((s) => s.deviceLabel)).toContain('Telefoon · Safari')
    expect(JSON.stringify(response.body)).not.toMatch(/ip|tokenHash/i)
  })

  it('"overal uitloggen" maakt andere sessies echt ongeldig', async () => {
    const { user, agent: laptop } = await loggedIn()
    const forgotten = browser()
    await forgotten.post('/api/auth/login').send({ email: user.email, password: PASSWORD })

    const response = await laptop.post('/api/me/sessions/revoke-others')
    expect(response.body.revoked).toBe(1)
    expect((await forgotten.get('/api/me/results')).status).toBe(401)
    expect((await laptop.get('/api/me/results')).status).toBe(200)
  })

  it('je kunt niet de sessies van een ander zien of intrekken', async () => {
    const { user: other } = await loggedIn()
    const { agent } = await loggedIn()
    await agent.post('/api/me/sessions/revoke-others')
    expect(await prisma.session.count({ where: { userId: other.id } })).toBe(1)
  })
})

describe('admin-uitslagen en overzicht', () => {
  it('een docent ziet alleen rondes van zijn eigen quizzen, met de eindstand', async () => {
    const { agent: emma } = await loggedIn({ username: 'Emma' })
    await playRound([
      { agent: emma, points: 900 },
      { agent: browser(), nickname: 'Gast', points: 100 },
    ])
    const { agent: otherTeacher } = await loggedIn({ role: 'TEACHER' })
    expect((await otherTeacher.get('/api/admin/results')).body.total).toBe(0)

    const { agent: admin } = await loggedIn({ role: 'ADMIN' })
    const list = await admin.get('/api/admin/results')
    expect(list.body.rounds[0]).toMatchObject({ quizTitle: 'Webtechniek · week 6', playerCount: 2, winner: 'Emma' })
    expect(list.body.stats).toMatchObject({ rounds: 1, players: 2, accountPercent: 50 })

    const round = await admin.get(`/api/admin/results/${list.body.rounds[0].id}`)
    expect(round.body.standings).toEqual([
      { nickname: 'Emma', rank: 1, score: 900, correctCount: 1, isBot: false, isVerified: true },
      { nickname: 'Gast', rank: 2, score: 100, correctCount: 1, isBot: false, isVerified: false },
    ])
    expect((await otherTeacher.get(`/api/admin/results/${list.body.rounds[0].id}`)).status).toBe(404)
    expect((await emma.get('/api/admin/results')).status).toBe(403)
  })

  it('geeft de cijfertegels van het overzicht', async () => {
    const { agent } = await loggedIn({ role: 'TEACHER' })
    await agent.post('/api/quizzes').send(quizInput())
    const response = await agent.get('/api/admin/stats')
    expect(response.body).toMatchObject({ quizzes: 1, roundsThisWeek: 0, correctPercent: null })
  })
})
