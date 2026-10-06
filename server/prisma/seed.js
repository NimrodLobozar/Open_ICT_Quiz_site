// Vult de database met beroepsrollen en voorbeeldquizzen.
// Draait automatisch bij `docker compose up`, en handmatig met:
//   docker compose exec server npx prisma db seed
//
// Idempotent: je kunt hem vaak draaien zonder dubbele data.
// - Rollen worden bijgewerkt (upsert op `key`).
// - Een quiz die al bestaat (zelfde titel) wordt overgeslagen. Wil je een gewijzigde quiz
//   opnieuw laden? Verwijder hem in Adminer, of reset alles met `docker compose down -v`.
import { prisma } from '../src/db/prisma.js'
import { quizzes, roles } from './seedData.js'

// Fisher-Yates: husselt de antwoordopties, zodat het juiste antwoord niet altijd bovenaan staat.
function shuffle(items) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

async function seedRoles() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, color: role.color },
      create: role,
    })
  }
  console.log(`✔ ${roles.length} beroepsrollen`)
}

async function seedQuizzes() {
  for (const quiz of quizzes) {
    const existing = await prisma.quiz.findFirst({ where: { title: quiz.title } })
    if (existing) {
      console.log(`- Quiz "${quiz.title}" bestaat al, overgeslagen`)
      continue
    }

    const role = quiz.roleKey
      ? await prisma.role.findUnique({ where: { key: quiz.roleKey } })
      : null

    await prisma.quiz.create({
      data: {
        title: quiz.title,
        description: quiz.description,
        roleId: role?.id ?? null,
        questions: {
          create: quiz.questions.map((question, index) => ({
            text: question.text,
            order: index + 1,
            difficulty: question.difficulty,
            roleId: role?.id ?? null,
            options: {
              create: shuffle(question.options).map((option, optionIndex) => ({
                text: option.text,
                isCorrect: option.correct,
                order: optionIndex + 1,
              })),
            },
          })),
        },
      },
    })
    console.log(`✔ Quiz "${quiz.title}" (${quiz.questions.length} vragen)`)
  }
}

try {
  await seedRoles()
  await seedQuizzes()
} catch (error) {
  console.error('Seed mislukt:', error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
