/**
 * Zet één gebruiker op slot tot het einde van de transactie (SELECT ... FOR UPDATE).
 * Komen er twee verzoeken voor dezelfde gebruiker tegelijk binnen (bijv. twee tabbladen, of een e-mailwijziging
 * terwijl de bevestigingslink gebruikt wordt), dan wacht het tweede hier tot het eerste klaar is.
 * Zo kunnen ze elkaars controle ("is dit adres nog vrij?", "heeft hij al een uitslag?") niet half inhalen.
 * Alleen bruikbaar binnen prisma.$transaction(async (tx) => { ... }).
 */
export function lockUser(tx, userId) {
  return tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
}
