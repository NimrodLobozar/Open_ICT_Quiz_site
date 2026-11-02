import { prisma } from './prisma.js'

/**
 * Slaat de eindstand van een game op: één GameSession met een GameResult per speler.
 * Verwacht dat game.finish() al is aangeroepen.
 */
export async function saveGameResults(game) {
  const record = game.toSessionRecord()
  if (!record) return null
  const saving = insertSession(record)
  // Onthouden welke ronde in welke GameSession staat (zie claimGuestResults).
  game.savedRounds.set(game.round, {
    sessionId: saving.then((session) => session.id).catch(() => null),
    playerIds: new Set(game.finalRanking.map((row) => row.id)),
  })
  return saving
}

async function insertSession(record) {
  const { results, ...session } = record
  // Heeft een speler tijdens de ronde zijn account verwijderd, dan bestaat zijn userId niet meer.
  // Zonder deze check zou de hele eindstand niet opgeslagen worden (foreign key), voor iedereen.
  const userIds = [...new Set(results.map((result) => result.userId).filter((id) => id !== null))]
  const existing = userIds.length
    ? new Set((await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } })).map((u) => u.id))
    : new Set()
  const rows = results.map((result) => ({ ...result, userId: existing.has(result.userId) ? result.userId : null }))

  // Geneste create: Prisma zet de sessie en alle resultaten in één transactie.
  // Of alles staat erin, of niets; nooit een half scoreboard.
  return prisma.gameSession.create({
    data: { ...session, results: { create: rows } },
  })
}

/**
 * Bug "account maken en score bewaren": een gast speelt, maakt daarna een account (of logt in),
 * en dan moet de score van die quiz op zijn account komen.
 * Hoe weten we dat het dezelfde persoon is? Zijn browser heeft nog de speler-cookie van deze game.
 * Alleen die browser kan dus deze score claimen, en maar één keer (userId moet nog leeg zijn).
 * @returns {Promise<number>} hoeveel uitslagen (rondes) er gekoppeld zijn
 */
export async function claimGuestResults(game, playerId, userId) {
  const player = game.getPlayer(playerId)
  // Speelde hij al met een account, dan staat de score al goed.
  if (!player || player.userId !== null || player.isBot) return 0
  let claimed = 0
  for (const { sessionId, playerIds } of game.savedRounds.values()) {
    if (!playerIds.has(playerId)) continue
    const id = await sessionId
    if (!id) continue
    // Gastnamen zijn uniek binnen een ronde (Game.addPlayer), dus naam + "nog geen account" wijst één rij aan.
    const { count } = await prisma.gameResult.updateMany({
      where: { sessionId: id, nickname: player.nickname, userId: null, isBot: false },
      data: { userId },
    })
    claimed += count
  }
  // Vanaf nu speelt hij in deze game met zijn account: een volgende ronde komt dan vanzelf op zijn account,
  // en het eindscherm noemt hem geen gast meer (ook na verversen, via game:sync).
  game.linkAccount(playerId, userId)
  return claimed
}

/**
 * Opslaan zonder dat het podium erop hoeft te wachten.
 * Ligt de database eruit, dan zien spelers gewoon hun eindstand; we loggen alleen de fout.
 */
export function saveGameResultsInBackground(game) {
  saveGameResults(game).catch((error) => {
    console.error(`Eindstand van game ${game.code} (ronde ${game.round}) niet opgeslagen:`, error)
  })
}
