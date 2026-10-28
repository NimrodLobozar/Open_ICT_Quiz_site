import { beforeEach, describe, expect, it } from 'vitest'
import { browser, makeUser, outbox, PASSWORD, prisma, resetDatabase, tokenFromMail } from './helpers.js'

// Story 1 (account aanmaken), story 2 (inloggen en uitloggen) en story 14 (alleen HU-adressen, e-mail bevestigen).
beforeEach(resetDatabase)

const signup = (overrides = {}) => ({
  username: 'Emma',
  email: 'Emma@Student.HU.nl',
  password: 'Geheim123',
  acceptPrivacy: true,
  ...overrides,
})

const authCookie = (response) => (response.headers['set-cookie'] ?? []).find((c) => c.startsWith('quiz_auth='))

describe('POST /api/auth/register', () => {
  it('maakt een studentaccount en slaat alleen een hash op, maar logt nog niet in (eerst bevestigen)', async () => {
    const agent = browser()
    const response = await agent.post('/api/auth/register').send(signup())

    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({ username: 'Emma', email: 'emma@student.hu.nl', role: 'STUDENT' })
    expect(response.body.user.passwordHash).toBeUndefined()
    expect(authCookie(response)).toBeUndefined()

    const user = await prisma.user.findUnique({ where: { email: 'emma@student.hu.nl' } })
    expect(user.passwordHash).not.toContain('Geheim123')
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/) // bcrypt
    expect(user.emailVerifiedAt).toBeNull()

    expect((await agent.get('/api/auth/me')).body.user).toBeNull()
  })

  it('negeert een meegestuurde rol: registreren geeft altijd STUDENT', async () => {
    const response = await browser().post('/api/auth/register').send(signup({ role: 'ADMIN' }))
    expect(response.status).toBe(201)
    expect(response.body.user.role).toBe('STUDENT')
  })

  it('weigert een e-mailadres dat al bestaat, met een duidelijke melding', async () => {
    await browser().post('/api/auth/register').send(signup())
    const response = await browser().post('/api/auth/register').send(signup({ username: 'Andere', email: 'emma@student.hu.nl' }))
    expect(response.status).toBe(409)
    expect(response.body.error).toBe('EMAIL_TAKEN')
    expect(response.body.message).toMatch(/e-mailadres/i)
  })

  it('weigert een gebruikersnaam die al bestaat, ook met andere hoofdletters', async () => {
    await browser().post('/api/auth/register').send(signup())
    const response = await browser().post('/api/auth/register').send(signup({ username: 'EMMA', email: 'ander@student.hu.nl' }))
    expect(response.status).toBe(409)
    expect(response.body.error).toBe('USERNAME_TAKEN')
  })

  it.each([
    ['te kort', 'Kort1'],
    ['geen cijfer', 'GeheimGeheim'],
    ['geen hoofdletter', 'geheim123'],
  ])('weigert een zwak wachtwoord (%s)', async (_label, password) => {
    const response = await browser().post('/api/auth/register').send(signup({ password }))
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('PASSWORD_WEAK')
  })

  it('weigert zonder akkoord met de privacyregels', async () => {
    const response = await browser().post('/api/auth/register').send(signup({ acceptPrivacy: false }))
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('PRIVACY_REQUIRED')
    expect(await prisma.user.count()).toBe(0)
  })

  it('weigert een ongeldig e-mailadres en een ongeldige gebruikersnaam', async () => {
    expect((await browser().post('/api/auth/register').send(signup({ email: 'geen-mail' }))).body.error).toBe('EMAIL_INVALID')
    expect((await browser().post('/api/auth/register').send(signup({ username: 'x' }))).body.error).toBe('USERNAME_INVALID')
    expect((await browser().post('/api/auth/register').send(signup({ username: '<script>' }))).body.error).toBe('USERNAME_INVALID')
  })
})

describe('POST /api/auth/login', () => {
  it('logt in met e-mailadres (hoofdletters maken niet uit) en wachtwoord', async () => {
    await makeUser({ email: 'sam@test.nl' })
    const agent = browser()
    const response = await agent.post('/api/auth/login').send({ email: ' SAM@test.nl ', password: PASSWORD })
    expect(response.status).toBe(200)
    expect(response.body.user.email).toBe('sam@test.nl')
    expect((await agent.get('/api/auth/me')).body.user.email).toBe('sam@test.nl')
  })

  it('geeft dezelfde melding bij een fout wachtwoord en een onbekend e-mailadres', async () => {
    await makeUser({ email: 'sam@test.nl' })
    const wrongPassword = await browser().post('/api/auth/login').send({ email: 'sam@test.nl', password: 'Fout1234' })
    const unknownEmail = await browser().post('/api/auth/login').send({ email: 'niemand@test.nl', password: PASSWORD })
    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownEmail.body)
  })

  it('laat een uitgenodigde docent zonder wachtwoord niet inloggen', async () => {
    await makeUser({ email: 'docent@test.nl', role: 'TEACHER', password: null })
    const response = await browser().post('/api/auth/login').send({ email: 'docent@test.nl', password: '' })
    expect(response.status).toBe(401)
  })

  it('"Ingelogd blijven" geeft een cookie van 30 dagen, anders een cookie tot de browser sluit', async () => {
    await makeUser({ email: 'sam@test.nl' })
    const remember = await browser().post('/api/auth/login').send({ email: 'sam@test.nl', password: PASSWORD, remember: true })
    const once = await browser().post('/api/auth/login').send({ email: 'sam@test.nl', password: PASSWORD, remember: false })
    expect(authCookie(remember)).toMatch(/Max-Age=2592000/)
    expect(authCookie(once)).not.toMatch(/Max-Age/)
  })

  it('blokkeert na 10 foute pogingen voor hetzelfde e-mailadres (429)', async () => {
    await makeUser({ email: 'raden@test.nl' })
    for (let i = 0; i < 10; i += 1) {
      await browser().post('/api/auth/login').send({ email: 'raden@test.nl', password: `Fout${i}abc` })
    }
    const blocked = await browser().post('/api/auth/login').send({ email: 'raden@test.nl', password: PASSWORD })
    expect(blocked.status).toBe(429)
    // Een ander account heeft er geen last van (de klas zit achter hetzelfde IP-adres).
    await makeUser({ email: 'ander@test.nl' })
    expect((await browser().post('/api/auth/login').send({ email: 'ander@test.nl', password: PASSWORD })).status).toBe(200)
  })
})

describe('uitloggen en beveiligde routes', () => {
  it('na uitloggen werkt de oude cookie niet meer, ook niet als je hem bewaard had', async () => {
    await makeUser({ email: 'sam@test.nl' })
    const agent = browser()
    const login = await agent.post('/api/auth/login').send({ email: 'sam@test.nl', password: PASSWORD })
    const stolenCookie = authCookie(login).split(';')[0]

    const logout = await agent.post('/api/auth/logout')
    expect(logout.status).toBe(200)
    expect(authCookie(logout)).toMatch(/quiz_auth=;/)
    expect((await agent.get('/api/auth/me')).body.user).toBeNull()

    // Iemand die de cookie had gekopieerd, kan er na het uitloggen ook niets meer mee.
    const replay = await browser().get('/api/me/results').set('Cookie', stolenCookie)
    expect(replay.status).toBe(401)
    expect(await prisma.session.count()).toBe(0)
  })

  it('beveiligde routes geven 401 zonder inloggen', async () => {
    for (const path of ['/api/me/results', '/api/me/sessions', '/api/quizzes', '/api/admin/users', '/api/admin/stats']) {
      expect((await browser().get(path)).status, path).toBe(401)
    }
  })

  it('persoonlijke antwoorden mogen niet in de browsercache blijven (terugknop na uitloggen)', async () => {
    const response = await browser().get('/api/auth/me')
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('een verlopen sessie werkt niet meer', async () => {
    await makeUser({ email: 'sam@test.nl' })
    const agent = browser()
    await agent.post('/api/auth/login').send({ email: 'sam@test.nl', password: PASSWORD })
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await agent.get('/api/auth/me')).body.user).toBeNull()
  })

  it('weigert een schrijfactie die geen JSON is (bescherming tegen CSRF via een formulier)', async () => {
    const response = await browser()
      .post('/api/auth/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=a@b.nl&password=x')
    expect(response.status).toBe(415)
  })

  it('geeft bij kapotte JSON een nette 400 zonder interne details', async () => {
    const response = await browser().post('/api/auth/login').set('Content-Type', 'application/json').send('{kapot')
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'BAD_JSON', message: expect.any(String) })
  })
})

describe('alleen HU-adressen (story 14)', () => {
  it.each(['emma@gmail.com', 'emma@nephu.nl', 'emma@hu.nl.voorbeeld.com'])('weigert %s met een uitleg', async (email) => {
    const response = await browser().post('/api/auth/register').send(signup({ email }))
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('EMAIL_NOT_HU')
    expect(response.body.message).toMatch(/@student\.hu\.nl of @hu\.nl/)
    expect(await prisma.user.count()).toBe(0)
  })

  it('accepteert ook @hu.nl, met hoofdletters', async () => {
    const response = await browser().post('/api/auth/register').send(signup({ email: 'Medewerker@HU.nl' }))
    expect(response.status).toBe(201)
    expect(response.body.user.email).toBe('medewerker@hu.nl')
  })
})

describe('e-mailadres bevestigen (story 14)', () => {
  it('stuurt een bevestigingsmail; na de link kan de speler inloggen', async () => {
    await browser().post('/api/auth/register').send(signup())
    const login = () => browser().post('/api/auth/login').send({ email: 'emma@student.hu.nl', password: 'Geheim123' })

    const before = await login()
    expect(before.status).toBe(403)
    expect(before.body.error).toBe('EMAIL_NOT_VERIFIED')

    const token = await tokenFromMail('emma@student.hu.nl', '/email-bevestigen')
    expect(token).toBeTruthy()
    expect(outbox.at(-1).subject).toMatch(/bevestig/i)
    expect((await browser().post('/api/auth/verify-email').send({ token })).status).toBe(200)
    // Werkt maar één keer.
    expect((await browser().post('/api/auth/verify-email').send({ token })).body.error).toBe('LINK_INVALID')

    const after = await login()
    expect(after.status).toBe(200)
    expect(authCookie(after)).toMatch(/HttpOnly/i)
  })

  it('een fout wachtwoord verraadt niet dat het account nog onbevestigd is', async () => {
    await makeUser({ email: 'nieuw@student.hu.nl', verified: false })
    const response = await browser().post('/api/auth/login').send({ email: 'nieuw@student.hu.nl', password: 'Fout1234' })
    expect(response.status).toBe(401)
    expect(response.body.error).toBe('INVALID_LOGIN')
  })

  it('een bevestigingslink kan geen wachtwoord instellen', async () => {
    await browser().post('/api/auth/register').send(signup())
    const token = await tokenFromMail('emma@student.hu.nl', '/email-bevestigen')
    expect((await browser().get('/api/auth/password-link').query({ token })).status).toBe(400)
    expect((await browser().post('/api/auth/password').send({ token, password: 'Overname123' })).status).toBe(400)
  })

  it('stuurt de mail opnieuw; alleen de nieuwste link werkt', async () => {
    await browser().post('/api/auth/register').send(signup())
    const first = await tokenFromMail('emma@student.hu.nl', '/email-bevestigen')
    outbox.length = 0

    const resend = await browser().post('/api/auth/resend-verification').send({ email: 'Emma@student.hu.nl' })
    expect(resend.body).toEqual({ ok: true })
    const second = await tokenFromMail('emma@student.hu.nl', '/email-bevestigen')
    expect(second).toBeTruthy()
    expect(second).not.toBe(first)
    expect((await browser().post('/api/auth/verify-email').send({ token: first })).status).toBe(400)
    expect((await browser().post('/api/auth/verify-email').send({ token: second })).status).toBe(200)
  })

  it('opnieuw sturen geeft altijd hetzelfde antwoord, en mailt niet bij een bevestigd of onbekend adres', async () => {
    await makeUser({ email: 'klaar@student.hu.nl' })
    const known = await browser().post('/api/auth/resend-verification').send({ email: 'klaar@student.hu.nl' })
    const unknown = await browser().post('/api/auth/resend-verification').send({ email: 'niemand@student.hu.nl' })
    expect(known.body).toEqual(unknown.body)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(outbox).toHaveLength(0)
  })

  it('een onbevestigd account houdt een adres niet bezet zodra de link verlopen is', async () => {
    await browser().post('/api/auth/register').send(signup())
    await tokenFromMail('emma@student.hu.nl', '/email-bevestigen')

    // Link nog geldig: het adres is (nog) bezet.
    const tooEarly = await browser().post('/api/auth/register').send(signup({ username: 'Echte Emma' }))
    expect(tooEarly.body.error).toBe('EMAIL_TAKEN')

    // Na 24 uur: iemand anders (de echte eigenaar) mag het adres wél gebruiken.
    await prisma.oneTimeToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })
    const later = await browser().post('/api/auth/register').send(signup({ username: 'Echte Emma' }))
    expect(later.status).toBe(201)
    expect(await prisma.user.count()).toBe(1)
  })

  it('een bevestigd account wordt nooit vrijgegeven', async () => {
    await makeUser({ username: 'Emma', email: 'emma@student.hu.nl' })
    const response = await browser().post('/api/auth/register').send(signup({ username: 'Andere' }))
    expect(response.body.error).toBe('EMAIL_TAKEN')
  })
})
