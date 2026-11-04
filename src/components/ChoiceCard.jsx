import { Tooltip } from 'antd'
import { Link } from 'react-router-dom'
import './ChoiceCard.css'

/**
 * Grote keuzeknop met titel en uitleg, voor keuzepagina's (startpagina, wat wil je hosten).
 * - primary: de opvallende (gevulde) knop.
 * - disabledReason: zet de knop uit en toont deze tekst als je eroverheen gaat.
 *   De knop blijft wel focusbaar, zodat je de uitleg ook met het toetsenbord ziet.
 */
export default function ChoiceCard({ to, title, text, primary = false, disabledReason }) {
  const className = `choice-card${primary ? ' choice-card--primary' : ''}`

  if (disabledReason) {
    return (
      <Tooltip title={disabledReason}>
        <div className={`${className} choice-card--disabled`} role="link" aria-disabled="true" tabIndex={0}>
          <span className="choice-card__badge">Binnenkort</span>
          <span className="choice-card__title">{title}</span>
          <span className="choice-card__text">{text}</span>
        </div>
      </Tooltip>
    )
  }

  return (
    <Link to={to} className={className}>
      <span className="choice-card__title">{title}</span>
      <span className="choice-card__text">{text}</span>
    </Link>
  )
}

/** Zet keuzeknoppen naast elkaar; op een telefoon onder elkaar. */
export function ChoiceGrid({ children }) {
  return <div className="choice-grid">{children}</div>
}
