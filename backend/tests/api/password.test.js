import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOneTimeToken } from '../../auth/oneTimeTokens.js'
import { hashToken } from '../../auth/tokens.js'
import { browser, makeUser, PASSWORD, prisma, resetDatabase } from './helpers.js'

// Story 3: wachtwoord vergeten (en dezelfde link-route voor de docent-uitnodiging van story 11).
beforeEach(resetDatabase)

describe('POST /api/auth/forgot', () => {
  it('geeft precies hetzelfde antwoord voor een bestaand en een onbekend e-mailadres', async () => {
    await makeUser({ email: 'sam@student.hu.nl' })
    const known = await browser().post('/api/auth/forgot').send({ email: 'sam@student.hu.nl' })
    const unknown = await browser().post('/api/auth/forgot').send({ email: 'niemand@student.hu.nl' })
    expect(known.status).toBe(200)
    expect(unknown.status).toBe(200)
    expect(known.body).toEqual(unknown.body)
  })

  it('maakt voor een bestaand account een link aan, en bewaart alleen de hash', async () => {
    const user = await makeUser({ email: 'sam@student.hu.nl' })
    await browser().post('/api/auth/forgot').send({ email: 'sam@student.hu.nl' })
    // De route wacht expres niet op de database (gelijke tijd), dus even wachten tot de rij er is.
    await vi.waitFor(async () => expect(await prisma.oneTimeToken.count({ where: { userId: user.id } })).toBe(1))
    const row = await prisma.oneTimeToken.findFirst()
    expect(row.purpose).toBe('RESET')
    expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(row.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(60 * 60 * 1000)
  })

  it('stuurt na 5 aanvragen per kwartier geen links meer, en zegt dat eerlijk (429)', async () => {
    const user = await makeUser({ email: 'spam@student.hu.nl' })
    for (let i = 0; i < 5; i += 1) {
      const response = await browser().post('/api/auth/forgot').send({ email: 'spam@student.hu.nl' })
      expect(response.body).toEqual({ ok: true })
    }
    const sixth = await browser().post('/api/auth/forgot').send({ email: 'spam@student.hu.nl' })
    expect(sixth.status).toBe(429)
    expect(sixth.body.message).toMatch(/kwartier/)
    await vi.waitFor(async () => expect(await prisma.oneTimeToken.count({ where: { userId: user.id } })).toBe(5))
  })

  it('de 429 verraadt niet of een adres een account heeft: een onbekend adres krijgt hem ook', async () => {
    for (let i = 0; i < 5; i += 1) await browser().post('/api/auth/forgot').send({ email: 'niemand@student.hu.nl' })
    expect((await browser().post('/api/auth/forgot').send({ email: 'niemand@student.hu.nl' })).status).toBe(429)
  })

  it('weigert een adres dat geen HU-adres is (bug: Gmail werkte ook), maar .local mag voorlopig', async () => {
    const gmail = await browser().post('/api/auth/forgot').send({ email: 'iemand@gmail.com' })
    expect(gmail.status).toBe(400)
    expect(gmail.body.error).toBe('EMAIL_NOT_HU')
    const local = await browser().post('/api/auth/forgot').send({ email: 'beheerder@quiz.local' })
    expect(local.status).toBe(200)
    const hu = await browser().post('/api/auth/forgot').send({ email: 'docent@hu.nl' })
    expect(hu.status).toBe(200)
  })
})

describe('nieuw wachtwoord via een link', () => {
  it('werkt met een geldige link, en daarna kun je inloggen met het nieuwe wachtwoord', async () => {
    const user = await makeUser({ email: 'sam@test.nl' })
    const token = await createOneTimeToken(user.id, 'RESET')

    const check = await browser().get('/api/auth/password-link').query({ token })
    expect(check.body).toEqual({ purpose: 'RESET', username: user.username })

    const reset = await browser().post('/api/auth/password').send({ token, password: 'NieuwWacht8' })
    expect(reset.status).toBe(200)

    expect((await browser().post('/api/auth/login').send({ email: 'sam@test.nl', password: PASSWORD })).status).toBe(401)
    expect((await browser().post('/api/auth/login').send({ email: 'sam@test.nl', password: 'NieuwWacht8' })).status).toBe(200)
  })

  it('een link werkt maar één keer', async () => {
    const user = await makeUser()
    const token = await createOneTimeToken(user.id, 'RESET')
    await browser().post('/api/auth/password').send({ token, password: 'NieuwWacht8' })
    const again = await browser().post('/api/auth/password').send({ token, password: 'Nogmaals99' })
    expect(again.status).toBe(400)
    expect(again.body.error).toBe('LINK_INVALID')
  })

  it('een verlopen link werkt niet', async () => {
    const user = await makeUser()
    const token = await createOneTimeToken(user.id, 'RESET')
    await prisma.oneTimeToken.update({ where: { tokenHash: hashToken(token) }, data: { expiresAt: new Date(Date.now() - 1) } })
    expect((await browser().get('/api/auth/password-link').query({ token })).status).toBe(400)
    expect((await browser().post('/api/auth/password').send({ token, password: 'NieuwWacht8' })).status).toBe(400)
  })

  it('een verzonnen link werkt niet', async () => {
    const response = await browser().post('/api/auth/password').send({ token: 'verzonnen', password: 'NieuwWacht8' })
    expect(response.status).toBe(400)
  })

  it('een oudere link werkt nog na een nieuwe aanvraag (de mail kan laat binnenkomen); na gebruik vervallen de andere', async () => {
    const user = await makeUser()
    const first = await createOneTimeToken(user.id, 'RESET')
    const second = await createOneTimeToken(user.id, 'RESET')
    expect((await browser().post('/api/auth/password').send({ token: first, password: 'NieuwWacht8' })).status).toBe(200)
    expect((await browser().post('/api/auth/password').send({ token: second, password: 'Nogmaals99' })).status).toBe(400)
  })

  it('weigert een zwak nieuw wachtwoord, en de link blijft dan bruikbaar', async () => {
    const user = await makeUser()
    const token = await createOneTimeToken(user.id, 'RESET')
    expect((await browser().post('/api/auth/password').send({ token, password: 'zwak' })).body.error).toBe('PASSWORD_WEAK')
    expect((await browser().post('/api/auth/password').send({ token, password: 'NieuwWacht8' })).status).toBe(200)
  })

  it('logt na een reset alle apparaten uit (een eventuele indringer ook)', async () => {
    const user = await makeUser({ email: 'sam@test.nl' })
    const agent = browser()
    await agent.post('/api/auth/login').send({ email: 'sam@test.nl', password: PASSWORD })
    const token = await createOneTimeToken(user.id, 'RESET')
    await browser().post('/api/auth/password').send({ token, password: 'NieuwWacht8' })
    expect((await agent.get('/api/auth/me')).body.user).toBeNull()
  })
})
