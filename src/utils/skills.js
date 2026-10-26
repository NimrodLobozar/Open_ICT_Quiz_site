// De zes vaardigheden van Open ICT, met de kleuren van de joinpagina.
// Gedeeld door frontend (sliders, balkjes op Mijn account) en backend (invoer controleren).
export const SKILLS = [
  { code: 'SD', color: '#f59e0b' },
  { code: 'AI', color: '#14b8a6' },
  { code: 'TI', color: '#facc15' },
  { code: 'CSC', color: '#6366f1' },
  { code: 'GD', color: '#22c55e' },
  { code: 'BI', color: '#3b82f6' },
]

export const SKILL_CODES = SKILLS.map((skill) => skill.code)

/**
 * Houdt alleen bekende vaardigheden met een heel getal van 0 t/m 5 over.
 * Nooit blind opslaan wat een browser stuurt.
 * @returns {Record<string, number>}
 */
export function cleanAccountSkills(skills) {
  if (!skills || typeof skills !== 'object' || Array.isArray(skills)) return {}
  return Object.fromEntries(
    SKILL_CODES.filter((code) => Number.isInteger(skills[code]) && skills[code] >= 0 && skills[code] <= 5).map(
      (code) => [code, skills[code]],
    ),
  )
}
