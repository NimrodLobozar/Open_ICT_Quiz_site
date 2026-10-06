// Instellingen die de host kiest op de HostSetupPage.
// Ongeldige of ontbrekende waarden worden vervangen door de standaardwaarde of begrensd.

export const DEFAULT_SETTINGS = {
  maxPlayers: 100, // TODO(team): Open punt 6, max. aantal spelers per lobby
  timePerQuestion: 20, // seconden
  questionPreviewSeconds: 0, // TODO(team): Open punt 1, eerst lezen (> 0) of direct antwoorden (0)?
}

const LIMITS = {
  maxPlayers: [1, 500],
  timePerQuestion: [5, 120],
  questionPreviewSeconds: [0, 30],
}

/**
 * @param {Partial<typeof DEFAULT_SETTINGS>} [input]
 * @returns {typeof DEFAULT_SETTINGS}
 */
export function normalizeSettings(input = {}) {
  const result = {}
  for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
    const value = Number(input?.[key])
    const [min, max] = LIMITS[key]
    result[key] = Number.isFinite(value)
      ? Math.min(Math.max(Math.round(value), min), max)
      : defaultValue
  }
  return result
}
