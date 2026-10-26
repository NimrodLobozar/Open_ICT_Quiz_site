import { Router } from 'express'
import { noStore, requireRole } from '../auth/middleware.js'
import { parseId, parseSearch } from '../auth/validate.js'
import { createQuiz, deleteQuiz, getQuiz, listQuizzes, quizForEditor, updateQuiz } from '../db/quizzes.js'
import { parseQuizInput } from '../quiz/quizRules.js'

// Quizzen beheren (story 7). Alleen docenten en beheerders; een docent alleen zijn eigen quizzen (zie db/quizzes.js).
const router = Router()
router.use(noStore, requireRole('TEACHER', 'ADMIN'))

router.get('/', async (request, response) => {
  response.json({ quizzes: await listQuizzes(request.user, parseSearch(request.query.q)) })
})

router.get('/:id', async (request, response) => {
  response.json({ quiz: quizForEditor(await getQuiz(parseId(request.params.id), request.user)) })
})

router.post('/', async (request, response) => {
  const quiz = await createQuiz(request.user, parseQuizInput(request.body))
  response.status(201).json({ quiz: quizForEditor(quiz) })
})

router.put('/:id', async (request, response) => {
  const quiz = await updateQuiz(parseId(request.params.id), request.user, parseQuizInput(request.body))
  response.json({ quiz: quizForEditor(quiz) })
})

router.delete('/:id', async (request, response) => {
  await deleteQuiz(parseId(request.params.id), request.user)
  response.json({ ok: true })
})

export default router
