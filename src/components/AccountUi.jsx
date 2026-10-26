import { useId, useState } from 'react'
import { checkPassword } from '../utils/passwordRules.js'
import { SKILLS } from '../utils/skills.js'
import { initials } from '../auth/AuthContext.jsx'
import './AccountUi.css'

// Kleine bouwstenen voor de account- en beheerpagina's (sprint 2), in de stijl van de designs
// in .claude/designs/accounts/. Zo ziet elk formulier er hetzelfde uit en hoeft niet elke pagina
// opnieuw labels, foutmeldingen en toegankelijkheid te regelen.

/** Melding boven een formulier. error = rood (role="alert": een schermlezer leest hem meteen voor). */
export function Notice({ type = 'error', children }) {
  if (!children) return null
  return (
    <p className={`ui-notice ui-notice--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {type === 'error' ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 16.5v.5" />
          </>
        ) : (
          <path d="M4 12l5 5L20 6" />
        )}
      </svg>
      <span>{children}</span>
    </p>
  )
}

/**
 * Label + invoerveld + uitleg + foutmelding, goed gekoppeld voor schermlezers (aria-describedby).
 * Alle andere props (type, value, onChange, autoComplete...) gaan door naar de <input>.
 */
export function TextField({ label, hint, error, action, suffix, className = '', ...inputProps }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={`ui-field ${className}`}>
      <div className="ui-field__top">
        <label htmlFor={id} className="ui-label">
          {label}
        </label>
        {action}
      </div>
      <div className="ui-input-wrap">
        <input
          id={id}
          className={`ui-input ${error ? 'is-invalid' : ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          {...inputProps}
        />
        {suffix}
      </div>
      {hint && (
        <span id={hintId} className="ui-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="ui-field-error">
          {error}
        </span>
      )}
    </div>
  )
}

/** Wachtwoordveld met een oogje om het wachtwoord even te tonen (handig op een telefoon). */
export function PasswordField(props) {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      type={visible ? 'text' : 'password'}
      className="ui-password"
      {...props}
      suffix={
      <button
        type="button"
        className="ui-password__toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
        aria-pressed={visible}
      >
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
      }
    />
  )
}

/** De wachtwoordeisen als vinkjes, terwijl je typt (story 1). Dezelfde regels als de server (passwordRules.js). */
export function PasswordChecklist({ password, id }) {
  return (
    <ul className="ui-checklist" id={id} aria-label="Eisen voor je wachtwoord">
      {checkPassword(password).map((rule) => (
        <li key={rule.id} className={rule.ok ? 'is-ok' : ''}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            {rule.ok ? <path d="M4 12l5 5L20 6" /> : <circle cx="12" cy="12" r="7" />}
          </svg>
          {rule.label}
          <span className="ui-sr-only">{rule.ok ? ' (in orde)' : ' (nog niet)'}</span>
        </li>
      ))}
    </ul>
  )
}

/** Vinkje met tekst (bijv. "Ingelogd blijven", privacyregels). */
export function Checkbox({ children, error, ...inputProps }) {
  return (
    <div className="ui-field">
      <label className="ui-checkbox">
        <input type="checkbox" aria-invalid={error ? true : undefined} {...inputProps} />
        <span>{children}</span>
      </label>
      {error && <span className="ui-field-error">{error}</span>}
    </div>
  )
}

/** Aan/uit-schakelaar (instellingen van story 8). Een echte knop met role="switch", dus ook met het toetsenbord te bedienen. */
export function Toggle({ label, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="ui-toggle"
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span>{label}</span>
      <span className="ui-toggle__track" aria-hidden="true">
        <span className="ui-toggle__knob" />
      </span>
    </button>
  )
}

/** Rondje met initialen. */
export function Avatar({ name, size = 'large' }) {
  return (
    <span aria-hidden="true" className={`ui-avatar ui-avatar--${size}`}>
      {initials(name)}
    </span>
  )
}

/** Rij cijfertegels (Mijn account, admin-overzicht, uitslagen). */
export function StatTiles({ stats, label }) {
  return (
    <ul className="ui-stats" aria-label={label}>
      {stats.map((stat) => (
        <li key={stat.label} className="ui-stat">
          <span className="ui-stat__value">{stat.value}</span>
          <span className="ui-stat__label">{stat.label}</span>
        </li>
      ))}
    </ul>
  )
}

/** Vaardigheden als balkjes (alleen lezen). */
export function SkillBars({ skills = {} }) {
  return (
    <ul className="ui-skills">
      {SKILLS.map(({ code }) => {
        const value = skills[code] ?? 0
        return (
          <li key={code} className="ui-skill">
            <span>{code}</span>
            <span role="img" aria-label={`${code}: ${value} van 5`} className="ui-skill__bar">
              <span style={{ width: `${(value / 5) * 100}%` }} />
            </span>
            <span className="ui-skill__value">{value}/5</span>
          </li>
        )
      })}
    </ul>
  )
}

/** Vaardigheden als schuifjes 0–5 (Instellingen). Gewone <input type="range">: werkt met toetsenbord en schermlezer. */
export function SkillSliders({ value, onChange }) {
  return (
    <div className="ui-sliders">
      {SKILLS.map(({ code, color }) => {
        const current = value[code] ?? 0
        return (
          <label key={code} className="ui-slider">
            <span className="ui-slider__label">
              <span className="ui-slider__dot" style={{ backgroundColor: color }} aria-hidden="true" />
              {code}
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={current}
              aria-valuetext={`${current} van 5`}
              onChange={(event) => onChange({ ...value, [code]: Number(event.target.value) })}
            />
            <strong aria-hidden="true">{current}</strong>
          </label>
        )
      })}
    </div>
  )
}
