import './AccountBadge.css'

/**
 * Klein icoontje achter een naam: deze speler speelt met een account.
 * Nodig omdat een gast en een account dezelfde naam mogen hebben (twee keer "John" in één lobby).
 * Met een tekst voor schermlezers, zodat het niet alleen een plaatje is.
 * @param {{ show?: boolean }} props  show = isVerified van de speler; false = niets tonen.
 */
export default function AccountBadge({ show = true }) {
  if (!show) return null
  return (
    <span className="account-badge" title="Speelt met een account">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </svg>
      <span className="account-badge__label">(account)</span>
    </span>
  )
}
