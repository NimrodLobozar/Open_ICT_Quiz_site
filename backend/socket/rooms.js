// Namen van de Socket.IO-rooms (projectplan 8.4).
// Een room is een groep sockets. io.to(room).emit(...) stuurt een bericht naar iedereen in die groep.

// Iedereen in de game: host én spelers.
export const gameRoom = (code) => code

// Alleen de host (bijv. voor "x van y heeft geantwoord").
export const hostRoom = (code) => `${code}:host`

// Eén speler. Een room in plaats van één socket-id, omdat een speler na verversen een nieuwe socket krijgt
// (of twee tabbladen open heeft). Zo komt een persoonlijk bericht altijd bij al zijn tabbladen aan.
export const playerRoom = (code, playerId) => `${code}:player:${playerId}`
