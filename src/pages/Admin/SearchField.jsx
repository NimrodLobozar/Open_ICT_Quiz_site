/** Rond zoekveld met vergrootglas, zoals in de admin-designs. Het label is onzichtbaar maar wel voor schermlezers. */
export default function SearchField({ label, value, onChange }) {
  return (
    <label className="ui-search">
      <span className="ui-sr-only">{label}</span>
      <input type="search" placeholder={label} value={value} onChange={(event) => onChange(event.target.value)} />
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
    </label>
  )
}
