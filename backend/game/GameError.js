// Een fout die we bewust teruggeven aan de client, met een vaste code (projectplan 8.1)
// en een HTTP-status voor de REST-routes. Andere fouten zijn bugs en worden een 500.
export class GameError extends Error {
  constructor(code, message, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}
