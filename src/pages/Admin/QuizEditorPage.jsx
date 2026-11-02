import { App as AntApp } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/http.js'
import { Notice, Toggle } from '../../components/AccountUi.jsx'
import AdminLayout from './AdminLayout.jsx'

// Zelfde grenzen als de server (backend/quiz/quizRules.js). De server controleert het echt;
// hier zijn ze alleen om de knoppen op tijd uit te zetten.
const MAX_QUESTIONS = 50
const MIN_OPTIONS = 2
const MAX_OPTIONS = 4
const TIME_OPTIONS = [10, 20, 30, 60]

const emptyQuestion = (timeLimitSec) => ({
  text: '',
  timeLimitSec,
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
})

/**
 * /admin/quizzen/nieuw en /admin/quizzen/:id: quiz maken of bewerken (story 7).
 * Een nieuwe quiz begint met de standaardinstellingen van de docent (story 8); per quiz kun je ze nog aanpassen.
 */
export default function QuizEditorPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { message } = AntApp.useApp()
  const [quiz, setQuiz] = useState(null)
  const [defaultTime, setDefaultTime] = useState(20)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (isNew) {
          const { defaults } = await api('/me/quiz-defaults')
          if (cancelled) return
          setDefaultTime(defaults.timePerQuestion)
          setQuiz({
            title: '',
            status: 'DRAFT',
            showCorrectAnswer: defaults.showCorrectAnswer,
            showStandings: defaults.showStandings,
            lockLobbyOnStart: defaults.lockLobbyOnStart,
            questions: [emptyQuestion(defaults.timePerQuestion)],
          })
        } else {
          const data = await api(`/quizzes/${id}`)
          if (!cancelled) setQuiz(data.quiz)
        }
      } catch (apiError) {
        if (!cancelled) setError(apiError.message)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  // Kleine helpers om één vraag of antwoord te veranderen zonder de rest kwijt te raken (state is onveranderlijk).
  const update = (changes) => setQuiz((current) => ({ ...current, ...changes }))
  const updateQuestion = (index, changes) =>
    setQuiz((current) => ({
      ...current,
      questions: current.questions.map((question, i) => (i === index ? { ...question, ...changes } : question)),
    }))
  const updateOption = (qIndex, oIndex, changes) =>
    updateQuestion(qIndex, {
      options: quiz.questions[qIndex].options.map((option, i) => (i === oIndex ? { ...option, ...changes } : option)),
    })
  const setCorrect = (qIndex, oIndex) =>
    updateQuestion(qIndex, {
      options: quiz.questions[qIndex].options.map((option, i) => ({ ...option, isCorrect: i === oIndex })),
    })
  function removeOption(qIndex, oIndex) {
    const options = quiz.questions[qIndex].options.filter((_, i) => i !== oIndex)
    // Was dit het goede antwoord? Dan wordt het eerste antwoord het goede, zodat er altijd één goed is.
    if (!options.some((option) => option.isCorrect)) options[0] = { ...options[0], isCorrect: true }
    updateQuestion(qIndex, { options })
  }
  function moveQuestion(index, step) {
    const questions = [...quiz.questions]
    ;[questions[index], questions[index + step]] = [questions[index + step], questions[index]]
    update({ questions })
  }

  async function save(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const body = {
        title: quiz.title,
        status: quiz.status,
        showCorrectAnswer: quiz.showCorrectAnswer,
        showStandings: quiz.showStandings,
        lockLobbyOnStart: quiz.lockLobbyOnStart,
        questions: quiz.questions,
      }
      const data = await api(isNew ? '/quizzes' : `/quizzes/${id}`, { method: isNew ? 'POST' : 'PUT', body })
      message.success('De quiz is opgeslagen.')
      if (isNew) navigate(`/admin/quizzen/${data.quiz.id}`, { replace: true })
      else setQuiz(data.quiz)
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  if (!quiz) {
    return (
      <AdminLayout title={isNew ? 'NIEUWE QUIZ' : 'QUIZ BEWERKEN'}>
        {error ? <Notice>{error}</Notice> : <p role="status">Laden…</p>}
      </AdminLayout>
    )
  }

  return (
    <AdminLayout kicker={isNew ? 'Quiz maken' : 'Quiz bewerken'} title={quiz.title.trim() ? quiz.title.toUpperCase() : 'NIEUWE QUIZ'}>
      <form className="quiz-editor" onSubmit={save} noValidate>
        <section className="ui-card quiz-editor__general" aria-labelledby="editor-general">
          <h2 id="editor-general" className="ui-section-title">
            Algemeen
          </h2>
          <label className="ui-field">
            <span className="ui-label">Titel</span>
            <input className="ui-input" maxLength={100} value={quiz.title} onChange={(e) => update({ title: e.target.value })} placeholder="Bijv. Webtechniek · week 7" />
          </label>
          <div role="group" aria-label="Status" className="quiz-editor__status">
            {[
              ['DRAFT', 'Concept'],
              ['READY', 'Klaar om te hosten'],
            ].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={quiz.status === value} onClick={() => update({ status: value })}>
                {label}
              </button>
            ))}
          </div>
          <div className="quiz-editor__toggles">
            <Toggle label="Goede antwoord tonen na elke vraag" checked={quiz.showCorrectAnswer} onChange={(value) => update({ showCorrectAnswer: value })} />
            <Toggle label="Tussenstand tonen" checked={quiz.showStandings} onChange={(value) => update({ showStandings: value })} />
            <Toggle label="Lobby dicht bij de start" checked={quiz.lockLobbyOnStart} onChange={(value) => update({ lockLobbyOnStart: value })} />
          </div>
        </section>

        <ol className="quiz-editor__questions">
          {quiz.questions.map((question, qIndex) => (
            <li key={qIndex} className="ui-card quiz-editor__question">
              <div className="quiz-editor__question-top">
                <h2 className="ui-section-title">Vraag {qIndex + 1}</h2>
                <span className="quiz-editor__question-tools">
                  <button type="button" className="ui-icon-btn" aria-label={`Vraag ${qIndex + 1} omhoog`} disabled={qIndex === 0} onClick={() => moveQuestion(qIndex, -1)}>
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
                  </button>
                  <button type="button" className="ui-icon-btn" aria-label={`Vraag ${qIndex + 1} omlaag`} disabled={qIndex === quiz.questions.length - 1} onClick={() => moveQuestion(qIndex, 1)}>
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  <button
                    type="button"
                    className="ui-icon-btn ui-icon-btn--danger"
                    aria-label={`Vraag ${qIndex + 1} verwijderen`}
                    onClick={() => update({ questions: quiz.questions.filter((_, i) => i !== qIndex) })}
                  >
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
                  </button>
                </span>
              </div>
              <label className="ui-field">
                <span className="ui-label">Vraag</span>
                <input className="ui-input ui-input--compact" maxLength={200} value={question.text} onChange={(e) => updateQuestion(qIndex, { text: e.target.value })} />
              </label>
              <label className="quiz-editor__time">
                <span className="ui-label">Tijd</span>
                <select className="ui-select" value={question.timeLimitSec} onChange={(e) => updateQuestion(qIndex, { timeLimitSec: Number(e.target.value) })}>
                  {[...new Set([...TIME_OPTIONS, question.timeLimitSec])].sort((a, b) => a - b).map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds} seconden
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="quiz-editor__options">
                <legend className="ui-label">Antwoorden (kies het goede)</legend>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className={`quiz-editor__option ${option.isCorrect ? 'is-correct' : ''}`}>
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={option.isCorrect}
                      onChange={() => setCorrect(qIndex, oIndex)}
                      aria-label={`Antwoord ${oIndex + 1} is het goede antwoord`}
                    />
                    <input
                      className="ui-input ui-input--compact"
                      maxLength={100}
                      value={option.text}
                      onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                      aria-label={`Antwoord ${oIndex + 1}`}
                      placeholder={`Antwoord ${oIndex + 1}`}
                    />
                    <button
                      type="button"
                      className="ui-icon-btn"
                      aria-label={`Antwoord ${oIndex + 1} verwijderen`}
                      disabled={question.options.length <= MIN_OPTIONS}
                      onClick={() => removeOption(qIndex, oIndex)}
                    >
                      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                ))}
                {question.options.length < MAX_OPTIONS && (
                  <button
                    type="button"
                    className="ui-btn ui-btn--small quiz-editor__add-option"
                    onClick={() => updateQuestion(qIndex, { options: [...question.options, { text: '', isCorrect: false }] })}
                  >
                    + Antwoord toevoegen
                  </button>
                )}
              </fieldset>
            </li>
          ))}
        </ol>

        {quiz.questions.length < MAX_QUESTIONS && (
          <button type="button" className="ui-btn quiz-editor__add" onClick={() => update({ questions: [...quiz.questions, emptyQuestion(defaultTime)] })}>
            + Vraag toevoegen
          </button>
        )}

        <div className="quiz-editor__footer">
          <Notice>{error}</Notice>
          <div className="quiz-editor__footer-buttons">
            <button type="button" className="ui-btn" onClick={() => navigate('/admin/quizzen')}>
              Terug
            </button>
            <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}>
              {busy ? 'Opslaan…' : 'Quiz opslaan'}
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}
