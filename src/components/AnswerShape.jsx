import './AnswerShape.css'

// Elk antwoord heeft een eigen kleur én vorm. Alleen kleur is niet genoeg:
// kleurenblinde spelers herkennen hun knop dan aan de vorm.
// Host en speler halen ze hier vandaan, zo is antwoord 1 op het bord en op je telefoon altijd hetzelfde.
const ANSWER_STYLES = [
  { name: 'driehoek', shape: <polygon points="12,3 22,21 2,21" /> },
  { name: 'ruit', shape: <polygon points="12,2 22,12 12,22 2,12" /> },
  { name: 'cirkel', shape: <circle cx="12" cy="12" r="10" /> },
  { name: 'vierkant', shape: <rect x="3" y="3" width="18" height="18" rx="2" /> },
]

/** Kleur en vorm van het antwoord op plek `index` (vanaf 0). Bij meer dan 4 antwoorden begint het opnieuw. */
export function getAnswerStyle(index) {
  return ANSWER_STYLES[index % ANSWER_STYLES.length]
}

/** CSS-klasse met de achtergrond- en tekstkleur van het antwoord op plek `index`. */
export function answerColorClass(index) {
  return `answer-color answer-color--${getAnswerStyle(index).name}`
}

/** Het vormpje (driehoek, ruit, …) van het antwoord op plek `index`. De maat komt van de pagina. */
export default function AnswerShape({ index, className = '' }) {
  return (
    <svg className={`answer-shape ${className}`} aria-hidden="true" viewBox="0 0 24 24">
      {getAnswerStyle(index).shape}
    </svg>
  )
}
