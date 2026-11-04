import { lockUser } from './locks.js'
import { prisma } from './prisma.js'
import { DELETED_PLAYER_NAME } from './users.js'

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
  // Tweede poging alleen als een account of de quiz precies tijdens het opslaan verdween (foreign key, P2003).
  // Bij die poging zien we dat het weg is en slaan we de rij op zonder die koppeling.
  try {
    return await insertOnce(record)
  } catch (error) {
    if (error?.code !== 'P2003') throw error
    return insertOnce(record)
  }
}

async function insertOnce(record) {
  const { results, ...session } = record
  // Is de quiz tijdens de ronde verwijderd, dan bestaat quizId niet meer. De titel staat er als kopie bij,
  // dus de uitslag blijft leesbaar, net als bij een quiz die ná het opslaan wordt verwijderd (onDelete: SetNull).
  // Zonder deze check zou de hele eindstand niet opgeslagen worden, voor iedereen.
  if (session.quizId !== null && session.quizId !== undefined) {
    const quiz = await prisma.quiz.findUnique({ where: { id: session.quizId }, select: { id: true } })
    if (!quiz) session.quizId = null
  }

  // Heeft een speler tijdens de ronde zijn account verwijderd, dan bestaat zijn userId niet meer.
  const userIds = [...new Set(results.map((result) => result.userId).filter((id) => id !== null))]
  const existing = userIds.length
    ? new Set((await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } })).map((u) => u.id))
    : new Set()
  const rows = results.map((result) => {
    if (result.userId === null || existing.has(result.userId)) return result
    // Account verwijderd: dezelfde anonieme rij als deleteUser maakt (backend/db/users.js).
    // Naam en vaardigheden komen nog uit het geheugen van de game, maar die mogen niet opnieuw opgeslagen worden.
    // Echte gasten (userId was al null) houden gewoon hun naam.
    return { ...result, userId: null, nickname: DELETED_PLAYER_NAME, skills: {} }
  })

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
  // Speelt dit account zelf al mee in deze game (bijv. in een andere browser)? Dan niets koppelen:
  // anders staat hetzelfde account twee keer in dezelfde eindstand. Zelfde regel als game.linkAccount.
  if ([...game.players.values()].some((other) => other.userId === user.id)) return 0
  // Eerst alle rij-ids van deze speler verzamelen (het opslaan kan nog bezig zijn, dus wachten).
  const resultIds = []
  for (const round of game.savedRounds.values()) {
    const resultId = (await round.resultIds).get(playerId)
    if (resultId) resultIds.push(resultId) // geen id: in deze ronde speelde hij niet mee
  }
  if (resultIds.length === 0) {
    game.linkAccount(playerId, user)
    return 0
  }

  // Het account op slot: logt hetzelfde account tegelijk in vanuit twee gast-browsers, dan wacht de tweede
  // tot de eerste klaar is. Daarna ziet hij de net gekoppelde uitslag en koppelt hij niets dubbel.
  const claimed = await prisma.$transaction(async (tx) => {
    await lockUser(tx, user.id)
    let count = 0
    for (const resultId of resultIds) {
      const updated = await tx.gameResult.updateMany({
        // Alleen als dit account nog geen uitslag in die ronde heeft.
        // Dat vangt ook een account dat in die ronde meedeed en de game intussen verliet.
        where: { id: resultId, userId: null, session: { results: { none: { userId: user.id } } } },
        data: { userId: user.id },
      })
      count += updated.count
    }
    return count
  })
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
