import './TimerRing.css'

// Omtrek van de ring (r = 20): 2 × π × 20.
const RING_LENGTH = 2 * Math.PI * 20

/**
 * Ronde timer met de seconden in het midden. De ring loopt leeg naarmate de tijd opraakt.
 * Rekent zelf niets uit: geef msLeft mee uit useCountdown, zodat iedereen dezelfde klok gebruikt.
 * @param {{ msLeft: number, limitMs: number, className?: string }} props
 *   className bepaalt de maat (width/height), de kleuren (--quiz-*) komen van de pagina.
 */
export default function TimerRing({ msLeft, limitMs, className = '' }) {
  const secondsLeft = Math.ceil(msLeft / 1000)
  // Hoeveel van de ring er nog staat: 1 = vol, 0 = leeg.
  const left = limitMs > 0 ? msLeft / limitMs : 0

  return (
    <div className={`timer-ring ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 48 48">
        <circle className="timer-ring__track" cx="24" cy="24" r="20" />
        <circle
          className="timer-ring__left"
          cx="24"
          cy="24"
          r="20"
          strokeDasharray={RING_LENGTH}
          // Hoe meer tijd voorbij is, hoe meer van de ring we "wegschuiven".
          strokeDashoffset={RING_LENGTH * (1 - left)}
        />
      </svg>
      <span role="timer" aria-label={msLeft === 0 ? 'Tijd is op' : `Nog ${secondsLeft} seconden`}>
        {secondsLeft}
      </span>
    </div>
  )
}
