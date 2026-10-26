import { beforeEach, describe, expect, it } from 'vitest'
import { browser, loggedIn, makeUser, prisma, resetDatabase } from './helpers.js'

// Story 10 (gebruikers bekijken), 11 (docent aanmaken, rol wijzigen) en 12 (aanpassen, verwijderen).
beforeEach(resetDatabase)

describe('alleen beheerders', () => {
  it('studenten en docenten krijgen 403 op gebruikersbeheer', async () => {
    const { agent: student } = await loggedIn({ role: 'STUDENT' })
    const { agent: teacher } = await loggedIn({ role: 'TEACHER' })
    for (const agent of [student, teacher]) {
      expect((await agent.get('/api/admin/users')).status).toBe(403)
      expect((await agent.post('/api/admin/users').send({ username: 'Hack', email: 'h@test.nl' })).status).toBe(403)
      expect((await agent.patch('/api/admin/users/1/role').send({ role: 'ADMIN' })).status).toBe(403)
      expect((await agent.delete('/api/admin/users/1')).status).toBe(403)
    }
  })

  it('een student kan zichzelf niet via de API beheerder maken', async () => {
    const { user, agent } = await loggedIn()
    await agent.patch(`/api/admin/users/${user.id}/role`).send({ role: 'ADMIN' })
    await agent.patch('/api/me').send({ role: 'ADMIN' })
    expect((await prisma.user.findUnique({ where: { id: user.id } })).role).toBe('STUDENT')
  })
})

describe('GET /api/admin/users (story 10)', () => {
  it('toont naam, e-mail, rol, aantal gespeeld en laatste activiteit, zonder wachtwoord-hash', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN', username: 'Jan' })
    await makeUser({ username: 'Emma', email: 'emma@student.hu.nl' })
    const response = await agent.get('/api/admin/users')
    expect(response.status).toBe(200)
    expect(response.body.total).toBe(2)
    const emma = response.body.users.find((u) => u.username === 'Emma')
    expect(emma).toMatchObject({ email: 'emma@student.hu.nl', role: 'STUDENT', played: 0, activated: true })
    expect(emma).toHaveProperty('lastActiveAt')
    expect(JSON.stringify(response.body)).not.toContain('passwordHash')
    // Beheerders staan bovenaan.
    expect(response.body.users[0].role).toBe('ADMIN')
  })

  it('filtert op rol en zoekt op naam of e-mail (hoofdletters maken niet uit)', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN', username: 'Jan' })
    await makeUser({ username: 'Emma', email: 'emma@student.hu.nl' })
    await makeUser({ username: 'Daan', email: 'daan@student.hu.nl' })
    await makeUser({ username: 'Sara', email: 's.bakker@hu.nl', role: 'TEACHER' })

    const teachers = await agent.get('/api/admin/users').query({ role: 'TEACHER' })
    expect(teachers.body.users.map((u) => u.username)).toEqual(['Sara'])

    const byName = await agent.get('/api/admin/users').query({ q: 'EMM' })
    expect(byName.body.users.map((u) => u.username)).toEqual(['Emma'])

    const byEmail = await agent.get('/api/admin/users').query({ q: 'bakker' })
    expect(byEmail.body.users.map((u) => u.username)).toEqual(['Sara'])

    const both = await agent.get('/api/admin/users').query({ q: 'student.hu', role: 'STUDENT' })
    expect(both.body.total).toBe(2)
  })

  it('verdeelt veel gebruikers over pagina\'s van 20', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN' })
    for (let i = 0; i < 24; i += 1) await makeUser()
    const page1 = await agent.get('/api/admin/users')
    const page2 = await agent.get('/api/admin/users').query({ page: 2 })
    expect(page1.body.users).toHaveLength(20)
    expect(page2.body.users).toHaveLength(5)
    expect(page1.body.total).toBe(25)
  })

  it('negeert een onbekende rol en een rare paginawaarde in plaats van te crashen', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN' })
    const response = await agent.get('/api/admin/users').query({ role: 'HACKER', page: '-5' })
    expect(response.status).toBe(200)
    expect(response.body.page).toBe(1)
  })
})

describe('docent toevoegen en rol wijzigen (story 11)', () => {
  it('maakt een docent met een uitnodigingslink; pas na die link kan hij inloggen', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN' })
    const response = await agent.post('/api/admin/users').send({ username: 'Sara Bakker', email: 'S.Bakker@hu.nl' })
    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({ role: 'TEACHER', email: 's.bakker@hu.nl' })
    expect(response.body.inviteLink).toMatch(/^http:\/\/quiz\.test\/wachtwoord-instellen\?token=/)

    expect((await browser().post('/api/auth/login').send({ email: 's.bakker@hu.nl', password: '' })).status).toBe(401)

    const token = new URL(response.body.inviteLink).searchParams.get('token')
    const link = await browser().get('/api/auth/password-link').query({ token })
    expect(link.body).toEqual({ purpose: 'INVITE', username: 'Sara Bakker' })
    expect((await browser().post('/api/auth/password').send({ token, password: 'Docent123' })).status).toBe(200)

    const login = await browser().post('/api/auth/login').send({ email: 's.bakker@hu.nl', password: 'Docent123' })
    expect(login.status).toBe(200)
    expect(login.body.user.role).toBe('TEACHER')
  })

  it('weigert een docent met een e-mailadres dat al bestaat', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN' })
    await makeUser({ email: 'bezet@hu.nl' })
    const response = await agent.post('/api/admin/users').send({ username: 'Nieuw', email: 'bezet@hu.nl' })
    expect(response.status).toBe(409)
    expect(response.body.error).toBe('EMAIL_TAKEN')
  })

  it('wijzigt de rol van een ander, en die moet daarna opnieuw inloggen', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN' })
    const { user: student, agent: studentAgent } = await loggedIn()
    const response = await agent.patch(`/api/admin/users/${student.id}/role`).send({ role: 'TEACHER' })
    expect(response.status).toBe(200)
    expect(response.body.user.role).toBe('TEACHER')
    expect((await studentAgent.get('/api/auth/me')).body.user).toBeNull()
  })

  it('een beheerder kan zijn eigen beheerdersrol niet weghalen', async () => {
    const { user, agent } = await loggedIn({ role: 'ADMIN' })
    const response = await agent.patch(`/api/admin/users/${user.id}/role`).send({ role: 'STUDENT' })
    expect(response.status).toBe(409)
    expect(response.body.error).toBe('OWN_ADMIN_ROLE')
    expect((await prisma.user.findUnique({ where: { id: user.id } })).role).toBe('ADMIN')
  })

  it('weigert een rol die niet bestaat', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN' })
    const other = await makeUser()
    expect((await agent.patch(`/api/admin/users/${other.id}/role`).send({ role: 'GOD' })).status).toBe(400)
  })

  it('geeft 404 voor een gebruiker die niet bestaat of een rare id', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN' })
    expect((await agent.patch('/api/admin/users/99999/role').send({ role: 'TEACHER' })).status).toBe(404)
    expect((await agent.patch('/api/admin/users/abc/role').send({ role: 'TEACHER' })).status).toBe(404)
  })
})

describe('gebruiker aanpassen of verwijderen (story 12)', () => {
  it('past naam en e-mailadres aan', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN' })
    const other = await makeUser({ username: 'Typo', email: 'typo@test.nl' })
    const response = await agent.patch(`/api/admin/users/${other.id}`).send({ username: 'Goed', email: 'goed@test.nl' })
    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({ username: 'Goed', email: 'goed@test.nl' })
  })

  it('verwijdert een speler; zijn uitslagen blijven staan maar anoniem, zodat de eindstand klopt', async () => {
    const { agent } = await loggedIn({ role: 'ADMIN' })
    const player = await makeUser({ username: 'Weg' })
    await prisma.gameSession.create({
      data: {
        code: '123456',
        startedAt: new Date(),
        results: {
          create: [
            { nickname: 'Weg', userId: player.id, score: 900, rank: 1, correctCount: 1 },
            { nickname: 'Blijft', score: 500, rank: 2, correctCount: 1 },
          ],
        },
      },
    })

    expect((await agent.delete(`/api/admin/users/${player.id}`)).status).toBe(200)
    expect(await prisma.user.findUnique({ where: { id: player.id } })).toBeNull()
    expect((await agent.get('/api/admin/users')).body.users.map((u) => u.username)).not.toContain('Weg')

    const results = await prisma.gameResult.findMany({ orderBy: { rank: 'asc' } })
    expect(results.map((r) => [r.nickname, r.rank, r.userId])).toEqual([
      ['Verwijderde speler', 1, null],
      ['Blijft', 2, null],
    ])
  })

  it('een beheerder kan zichzelf hier niet verwijderen', async () => {
    const { user, agent } = await loggedIn({ role: 'ADMIN' })
    const response = await agent.delete(`/api/admin/users/${user.id}`)
    expect(response.status).toBe(409)
    expect(response.body.error).toBe('DELETE_SELF')
  })
})
