// De zes vaardigheden van Open ICT, met de kleuren van de joinpagina.
// Gedeeld door frontend (sliders, balkjes op Mijn account) en backend (invoer controleren).
// name = de volledige naam van de beroepsrol, voor de tussenstand en de quiz-editor.
export const SKILLS = [
  { code: 'SD', color: '#f59e0b', name: 'Software Development' },
  { code: 'AI', color: '#14b8a6', name: 'Artificial Intelligence' },
  { code: 'TI', color: '#facc15', name: 'Technische Informatica' },
  { code: 'CSC', color: '#6366f1', name: 'Cyber Security & Cloud' },
  { code: 'GD', color: '#22c55e', name: 'Game Development' },
  { code: 'BI', color: '#3b82f6', name: 'Business & IT' },
]

export const SKILL_CODES = SKILLS.map((skill) => skill.code)

// Beginwaarde van de sliders op de joinpagina voor een gast (zonder account).
export const GUEST_DEFAULT_SKILL = 5

/**
 * Beginwaarden van de sliders op de joinpagina.
 * Met een account: je opgeslagen vaardigheden, en 0 voor wat je nog niet invulde.
 * (Bug: een nieuw account heeft nog niets opgeslagen, en dan stonden alle sliders op 5.)
 * Zonder account: GUEST_DEFAULT_SKILL.
 * @param {{ skills?: Record<string, number> } | null} user
 * @returns {Record<string, number>}
 */
export function joinStartSkills(user) {
  return Object.fromEntries(
    SKILL_CODES.map((code) => [code, user ? (user.skills?.[code] ?? 0) : GUEST_DEFAULT_SKILL]),
  )
}

/** De vaardigheid bij een code ("SD" → { code, color, name }), of null. */
export function findSkill(code) {
  return SKILLS.find((skill) => skill.code === code) ?? null
}

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
