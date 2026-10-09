// Kleine fetch-helper voor /api. Cookies gaan automatisch mee (zelfde origin dankzij de Vite-proxy).

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? 'SERVER_ERROR', data.message ?? 'Er ging iets mis.')
  }
  return data
}
