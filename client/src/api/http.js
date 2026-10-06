// Kleine fetch-helper voor de REST-API (/api/...).
// De browser stuurt cookies automatisch mee (zelfde origin dankzij de Vite-proxy).

/** Fout van de API, met de foutcode van de server (bijv. 'NAME_TAKEN'). */
export class ApiError extends Error {
  constructor(status, error, message) {
    super(message)
    this.status = status
    this.error = error
  }
}

/**
 * @param {string} path bijv. '/quizzes?search=web' (zonder /api)
 * @param {{ method?: string, body?: unknown }} [options]
 * @returns {Promise<any>} de JSON uit het antwoord
 * @throws {ApiError}
 */
export async function api(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Geen verbinding met de server.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error ?? 'UNKNOWN',
      data.message ?? 'Er ging iets mis.',
    )
  }
  return data
}
