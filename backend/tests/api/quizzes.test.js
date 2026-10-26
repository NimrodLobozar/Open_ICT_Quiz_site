import { beforeEach, describe, expect, it } from 'vitest'
import { gameManager } from '../../game/GameManager.js'
import { loggedIn, prisma, quizInput, resetDatabase } from './helpers.js'

// Story 7 (quizzen beheren en hosten) en story 8 (standaardinstellingen).
beforeEach(resetDatabase)

describe('quizzen beheren (story 7)', () => {
  it('alleen docenten en beheerders kunnen bij quizzen', async () => {
    const { agent } = await loggedIn({ role: 'STUDENT' })
    expect((await agent.get('/api/quizzes')).status).toBe(403)
    expect((await agent.post('/api/quizzes').send(quizInput())).status).toBe(403)
  })

  it('een docent maakt een quiz en ziet alleen zijn eigen quizzen, met zoeken op naam', async () => {
    const { agent: sara } = await loggedIn({ role: 'TEACHER' })
    const { agent: pieter } = await loggedIn({ role: 'TEACHER' })
    await sara.post('/api/quizzes').send(quizInput({ title: 'Webtechniek · week 6' }))
    await sara.post('/api/quizzes').send(quizInput({ title: 'Databases · SQL', status: 'DRAFT' }))
    await pieter.post('/api/quizzes').send(quizInput({ title: 'Netwerken' }))

    const list = await sara.get('/api/quizzes')
    expect(list.body.quizzes.map((q) => q.title).sort()).toEqual(['Databases · SQL', 'Webtechniek · week 6'])
    expect(list.body.quizzes.find((q) => q.title.startsWith('Databases'))).toMatchObject({ status: 'DRAFT', questionCount: 1 })

    const search = await sara.get('/api/quizzes').query({ q: 'web' })
    expect(search.body.quizzes.map((q) => q.title)).toEqual(['Webtechniek · week 6'])
  })

  it('een docent kan de quiz van een collega niet openen, wijzigen, verwijderen of hosten (404)', async () => {
    const { agent: sara } = await loggedIn({ role: 'TEACHER' })
    const { agent: pieter } = await loggedIn({ role: 'TEACHER' })
    const { body } = await sara.post('/api/quizzes').send(quizInput())
    const id = body.quiz.id
    expect((await pieter.get(`/api/quizzes/${id}`)).status).toBe(404)
    expect((await pieter.put(`/api/quizzes/${id}`).send(quizInput({ title: 'Gekaapt' }))).status).toBe(404)
    expect((await pieter.delete(`/api/quizzes/${id}`)).status).toBe(404)
    expect((await pieter.post('/api/games').send({ quizId: id })).status).toBe(404)
  })

  it('een beheerder ziet alle quizzen', async () => {
    const { agent: sara } = await loggedIn({ role: 'TEACHER' })
    const { agent: admin } = await loggedIn({ role: 'ADMIN' })
    await sara.post('/api/quizzes').send(quizInput())
    expect((await admin.get('/api/quizzes')).body.quizzes).toHaveLength(1)
  })

  it('bewerken vervangt titel, status en vragen', async () => {
    const { agent } = await loggedIn({ role: 'TEACHER' })
    const { body } = await agent.post('/api/quizzes').send(quizInput())
    const changed = quizInput({
      title: 'Nieuw',
      status: 'DRAFT',
      questions: [
        { text: 'V1', options: [{ text: 'a', isCorrect: true }, { text: 'b' }, { text: 'c' }] },
        { text: 'V2', options: [{ text: 'x' }, { text: 'y', isCorrect: true }] },
      ],
    })
    const response = await agent.put(`/api/quizzes/${body.quiz.id}`).send(changed)
    expect(response.status).toBe(200)
    expect(response.body.quiz.title).toBe('Nieuw')
    expect(response.body.quiz.questions.map((q) => q.text)).toEqual(['V1', 'V2'])
    expect(await prisma.question.count()).toBe(2)
  })

  it.each([
    ['geen titel', { title: '' }],
    ['twee goede antwoorden', { questions: [{ text: 'V', options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: true }] }] }],
    ['geen goed antwoord', { questions: [{ text: 'V', options: [{ text: 'a' }, { text: 'b' }] }] }],
    ['maar één antwoord', { questions: [{ text: 'V', options: [{ text: 'a', isCorrect: true }] }] }],
    ['klaar zonder vragen', { status: 'READY', questions: [] }],
    ['onbekende status', { status: 'LIVE' }],
    ['tijd te lang', { questions: [{ text: 'V', timeLimitSec: 999, options: [{ text: 'a', isCorrect: true }, { text: 'b' }] }] }],
  ])('weigert een ongeldige quiz (%s) met een duidelijke melding', async (_label, overrides) => {
    const { agent } = await loggedIn({ role: 'TEACHER' })
    const response = await agent.post('/api/quizzes').send(quizInput(overrides))
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('QUIZ_INVALID')
    expect(response.body.message.length).toBeGreaterThan(5)
  })
})

describe('hosten met een quizId (story 7)', () => {
  it('een quiz die klaar is, start een echte game met de vragen uit de database', async () => {
    const { agent } = await loggedIn({ role: 'TEACHER' })
    const { body } = await agent.post('/api/quizzes').send(quizInput({ title: 'Bytes' }))
    const response = await agent.post('/api/games').send({ quizId: body.quiz.id })
    expect(response.status).toBe(201)

    const game = gameManager.getGame(response.body.gameCode)
    expect(game.quizTitle).toBe('Bytes')
    expect(game.questions[0]).toEqual({
      text: 'Hoeveel bits zitten er in een byte?',
      timeLimitSec: 20,
      options: [
        { id: 1, text: '4', isCorrect: false },
        { id: 2, text: '8', isCorrect: true },
      ],
    })
    // De speler ziet de quiztitel op het joinscherm, maar nooit het goede antwoord.
    const info = await agent.get(`/api/games/${response.body.gameCode}`)
    expect(info.body.quizTitle).toBe('Bytes')
  })

  it('een concept-quiz kan niet gehost worden', async () => {
    const { agent } = await loggedIn({ role: 'TEACHER' })
    const { body } = await agent.post('/api/quizzes').send(quizInput({ status: 'DRAFT' }))
    const response = await agent.post('/api/games').send({ quizId: body.quiz.id })
    expect(response.status).toBe(409)
    expect(response.body.error).toBe('QUIZ_DRAFT')
  })

  it('studenten en gasten kunnen niet hosten; zonder quizId ook niet', async () => {
    const { agent: student } = await loggedIn({ role: 'STUDENT' })
    const { agent: teacher } = await loggedIn({ role: 'TEACHER' })
    expect((await student.post('/api/games').send({ quizId: 1 })).status).toBe(403)
    expect((await teacher.post('/api/games').send({})).status).toBe(400)
  })
})

describe('standaardinstellingen (story 8)', () => {
  it('slaat de standaard op en een nieuwe quiz neemt die over', async () => {
    const { agent } = await loggedIn({ role: 'TEACHER' })
    const saved = await agent
      .put('/api/me/quiz-defaults')
      .send({ timePerQuestion: 30, showCorrectAnswer: false, showStandings: true, lockLobbyOnStart: true })
    expect(saved.body.defaults).toEqual({ timePerQuestion: 30, showCorrectAnswer: false, showStandings: true, lockLobbyOnStart: true })

    const input = quizInput()
    delete input.questions[0].timeLimitSec
    const { body } = await agent.post('/api/quizzes').send(input)
    expect(body.quiz).toMatchObject({ showCorrectAnswer: false, showStandings: true, lockLobbyOnStart: true })
    expect(body.quiz.questions[0].timeLimitSec).toBe(30)
  })

  it('wat de docent bij de quiz zelf kiest, wint van de standaard', async () => {
    const { agent } = await loggedIn({ role: 'TEACHER' })
    await agent.put('/api/me/quiz-defaults').send({ showCorrectAnswer: false })
    const { body } = await agent.post('/api/quizzes').send(quizInput({ showCorrectAnswer: true }))
    expect(body.quiz.showCorrectAnswer).toBe(true)
  })

  it('een nieuwe standaard verandert bestaande quizzen niet', async () => {
    const { agent } = await loggedIn({ role: 'TEACHER' })
    const { body } = await agent.post('/api/quizzes').send(quizInput())
    await agent.put('/api/me/quiz-defaults').send({ showStandings: false })
    const quiz = await agent.get(`/api/quizzes/${body.quiz.id}`)
    expect(quiz.body.quiz.showStandings).toBe(true)
  })

  it('blijft bewaard na opnieuw inloggen, en onzin wordt de systeemstandaard', async () => {
    const { user, agent } = await loggedIn({ role: 'TEACHER' })
    await agent.put('/api/me/quiz-defaults').send({ timePerQuestion: 999, showStandings: 'ja', hack: true })
    await agent.post('/api/auth/logout')
    const { agent: again } = { agent: (await import('./helpers.js')).browser() }
    await again.post('/api/auth/login').send({ email: user.email, password: 'Geheim123' })
    const response = await again.get('/api/me/quiz-defaults')
    expect(response.body.defaults).toEqual({ timePerQuestion: 20, showCorrectAnswer: true, showStandings: true, lockLobbyOnStart: false })
  })

  it('studenten hebben geen quiz-instellingen', async () => {
    const { agent } = await loggedIn({ role: 'STUDENT' })
    expect((await agent.get('/api/me/quiz-defaults')).status).toBe(403)
  })
})
