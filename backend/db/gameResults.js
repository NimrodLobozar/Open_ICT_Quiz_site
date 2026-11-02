import { prisma } from './prisma.js'

/**
 * Slaat de eindstand van een game op: één GameSession met een GameResult per speler.
 * Verwacht dat game.finish() al is aangeroepen.
 */
export async function saveGameResults(game) {
  const record = game.toSessionRecord()
  if (!record) return null
  // toSessionRecord zet de rijen in dezelfde volgorde als finalRanking: rij i hoort bij speler finalRanking[i].
  const playerIds = game.finalRanking.map((row) => row.id)
  const saving = insertSession(record)
  // Onthouden welke speler in welke GameResult-rij staat (zie claimGuestResults).
  // Op id en niet op naam: een gast en een account kunnen dezelfde naam hebben.
  game.savedRounds.set(game.round, {
    resultIds: saving
      .then(({ resultIds }) => new Map(playerIds.map((playerId, i) => [playerId, resultIds[i]])))
      .catch(() => new Map()),
  })
  return (await saving).session
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

  // Eén transactie: of alles staat erin, of niets; nooit een half scoreboard.
  // De rijen één voor één, zodat we per rij het id weten (createMany geeft geen gegarandeerde volgorde terug).
  return prisma.$transaction(async (tx) => {
    const created = await tx.gameSession.create({ data: session })
    const resultIds = []
    for (const row of rows) {
      const result = await tx.gameResult.create({ data: { ...row, sessionId: created.id }, select: { id: true } })
      resultIds.push(result.id)
    }
    return { session: created, resultIds }
  })
}

/**
 * Bug "account maken en score bewaren": een gast speelt, maakt daarna een account (of logt in),
 * en dan moet de score van die quiz op zijn account komen.
 * Hoe weten we dat het dezelfde persoon is? Zijn browser heeft nog de speler-cookie van deze game.
 * Alleen die browser kan dus deze score claimen, en maar één keer (userId moet nog leeg zijn).
 * We pakken precies de rij van deze speler (op id), nooit "een rij met dezelfde naam":
 * anders kon een gast de score claimen van een account met dezelfde naam dat intussen verwijderd is.
 * @param {{ id: number, username: string }} user
 * @returns {Promise<number>} hoeveel uitslagen (rondes) er gekoppeld zijn
 */
export async function claimGuestResults(game, playerId, user) {
  const player = game.getPlayer(playerId)
  // Speelde hij al met een account, dan staat de score al goed.
  if (!player || player.userId !== null || player.isBot) return 0
  let claimed = 0
  for (const { resultIds } of game.savedRounds.values()) {
    const resultId = (await resultIds).get(playerId)
    if (!resultId) continue // in deze ronde speelde hij niet mee
    const { count } = await prisma.gameResult.updateMany({
      where: { id: resultId, userId: null },
      data: { userId: user.id },
    })
    claimed += count
  }
  // Vanaf nu speelt hij in deze game met zijn account: een volgende ronde komt dan vanzelf op zijn account,
  // en het eindscherm noemt hem geen gast meer (ook na verversen, via game:sync).
  game.linkAccount(playerId, user)
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
