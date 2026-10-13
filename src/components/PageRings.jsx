import './PageRings.css'

// De vier cirkels (straal in procenten van het vierkant).
const RINGS = [48, 38, 28, 18]

/**
 * Grote cirkels bovenaan, half buiten beeld, als rustige achtergrond op het grote scherm van de host.
 * Zet hem als eerste in <div className="page">; .page (src/index.css) houdt hem achter de inhoud.
 */
export default function PageRings() {
  return (
    <svg className="page-rings" aria-hidden="true" viewBox="0 0 100 100">
      {RINGS.map((r) => (
        <circle key={r} cx="50" cy="50" r={r} />
      ))}
    </svg>
  )
}
