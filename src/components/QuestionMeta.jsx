import { findSkill } from '../utils/skills.js'
import './QuestionMeta.css'

/**
 * Bij welke vaardigheid (beroepsrol) een vraag hoorde en hoe moeilijk hij was, voor de tussenstand.
 * Komt uit question:end (skill/difficulty). Een quiz zonder die gegevens toont niets.
 * @param {{ skill?: string | null, difficulty?: number | null, size?: 'large' }} props
 */
export default function QuestionMeta({ skill = null, difficulty = null, size }) {
  const found = findSkill(skill)
  if (!found && !difficulty) return null
  return (
    <p className={`question-meta ${size === 'large' ? 'question-meta--large' : ''}`}>
      {found && (
        <span className="question-meta__chip">
          <span className="question-meta__dot" style={{ backgroundColor: found.color }} aria-hidden="true" />
          {found.name}
        </span>
      )}
      {difficulty && (
        <span className="question-meta__chip">
          {/* Vijf blokjes, zoveel gevuld als het niveau. De tekst erachter zegt hetzelfde voor schermlezers. */}
          <span className="question-meta__level" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((level) => (
              <span key={level} className={level <= difficulty ? 'is-on' : ''} />
            ))}
          </span>
          Niveau {difficulty} van 5
        </span>
      )}
    </p>
  )
}
