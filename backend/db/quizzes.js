import { applyQuizDefaults, cleanQuizDefaults } from '../quiz/quizRules.js'
import { ApiError } from '../utils/ApiError.js'
import { prisma } from './prisma.js'

// Quizzen in de database (story 7). Een docent ziet en bewerkt alleen zijn eigen quizzen; een beheerder alles.

const withQuestions = {
  questions: {
    orderBy: { order: 'asc' },
    include: { options: { orderBy: { order: 'asc' } } },
  },
}

// Zelfde filter overal: zo kan een docent nooit via een andere route bij de quiz van een collega.
const ownedBy = (user) => (user.role === 'ADMIN' ? {} : { ownerId: user.id })

/** De lijst voor het admin-overzicht, met zoeken op titel. */
export async function listQuizzes(user, q = '') {
  const quizzes = await prisma.quiz.findMany({
    where: { ...ownedBy(user), ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    include: {
      owner: { select: { username: true } },
      _count: { select: { questions: true } },
      sessions: { orderBy: { endedAt: 'desc' }, take: 1, select: { endedAt: true } },
    },
  })
  return quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    status: quiz.status,
    owner: quiz.owner?.username ?? null,
    questionCount: quiz._count.questions,
    lastPlayedAt: quiz.sessions[0]?.endedAt ?? null,
    updatedAt: quiz.updatedAt,
  }))
}

/** Eén quiz mét vragen en goede antwoorden. Niet van jou = 404, alsof hij niet bestaat. */
export async function getQuiz(id, user) {
  const quiz = await prisma.quiz.findFirst({ where: { id, ...ownedBy(user) }, include: withQuestions })
  if (!quiz) throw new ApiError('QUIZ_NOT_FOUND', 'Deze quiz bestaat niet.', 404)
  return quiz
}

// Van de gecontroleerde invoer (parseQuizInput) naar Prisma's geneste create.
function toQuizData(input, settings) {
  return {
    title: input.title,
    status: input.status,
    showCorrectAnswer: settings.showCorrectAnswer,
    showStandings: settings.showStandings,
    lockLobbyOnStart: settings.lockLobbyOnStart,
    questions: {
      create: input.questions.map((question, index) => ({
        text: question.text,
        order: index,
        timeLimitSec: question.timeLimitSec ?? settings.timePerQuestion,
        options: {
          create: question.options.map((option, optionIndex) => ({ ...option, order: optionIndex })),
        },
      })),
    },
  }
}

/** Nieuwe quiz. Instellingen die de editor niet meestuurt, komen uit de standaard van de docent (story 8). */
export async function createQuiz(user, input) {
  const settings = applyQuizDefaults(cleanQuizDefaults(user.quizDefaults), input.settings)
  return prisma.quiz.create({
    data: { ...toQuizData(input, settings), ownerId: user.id },
    include: withQuestions,
  })
}

/** Quiz bewerken: titel, status, instellingen en álle vragen worden vervangen door wat de editor stuurt. */
export async function updateQuiz(id, user, input) {
  const existing = await getQuiz(id, user)
  // Bij bewerken vult de quiz zelf de lege instellingen aan, niet de (misschien veranderde) standaard van de docent.
  const current = {
    timePerQuestion: existing.questions[0]?.timeLimitSec ?? cleanQuizDefaults(user.quizDefaults).timePerQuestion,
    showCorrectAnswer: existing.showCorrectAnswer,
    showStandings: existing.showStandings,
    lockLobbyOnStart: existing.lockLobbyOnStart,
  }
  const settings = applyQuizDefaults(current, input.settings)
  // In één transactie: oude vragen weg en nieuwe erin. Gaat er iets mis, dan blijft de oude quiz staan.
  return prisma.$transaction(async (tx) => {
    await tx.question.deleteMany({ where: { quizId: id } })
    return tx.quiz.update({ where: { id }, data: toQuizData(input, settings), include: withQuestions })
  })
}

export async function deleteQuiz(id, user) {
  await getQuiz(id, user)
  await prisma.quiz.delete({ where: { id } })
}

/**
 * Van databaserijen naar het formaat dat Game verwacht (zie backend/game/quizQuestions.js).
 * Antwoord-id's zijn 1 t/m 4 per vraag, net als bij de vaste vragen: de schermen koppelen daar de vormen aan.
 */
export function toGameQuestions(quiz) {
  return quiz.questions.map((question) => ({
    text: question.text,
    timeLimitSec: question.timeLimitSec,
    options: question.options.map((option, index) => ({ id: index + 1, text: option.text, isCorrect: option.isCorrect })),
  }))
}

/** Wat de editor nodig heeft om een quiz te tonen. */
export function quizForEditor(quiz) {
  return {
    id: quiz.id,
    title: quiz.title,
    status: quiz.status,
    showCorrectAnswer: quiz.showCorrectAnswer,
    showStandings: quiz.showStandings,
    lockLobbyOnStart: quiz.lockLobbyOnStart,
    questions: quiz.questions.map((question) => ({
      text: question.text,
      timeLimitSec: question.timeLimitSec,
      options: question.options.map((option) => ({ text: option.text, isCorrect: option.isCorrect })),
    })),
  }
}
