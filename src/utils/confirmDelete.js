// De bevestiging bij "Account verwijderen" (story 6): de knop werkt pas als je dit woord letterlijk typt.
// Zo verwijder je je account nooit per ongeluk met één klik. Gedeeld bestand, zodat het te testen is.
export const DELETE_CONFIRM_WORD = 'VERWIJDER'

/**
 * Heeft de gebruiker het bevestigingswoord goed getypt? Spaties aan het begin of eind tellen niet mee;
 * hoofdletters wél ("verwijder" is niet genoeg), zodat je echt even moet opletten.
 * @param {string | undefined} typed
 */
export function isDeleteConfirmed(typed) {
  // USER IMPLEMENTATION (S6): geef true terug als `typed`, zonder spaties aan begin en eind,
  // precies gelijk is aan DELETE_CONFIRM_WORD. Let op: `typed` kan ook undefined zijn.
  // Tot je dit invult, blijft de verwijderknop altijd uit (veilig).
  // Stappenplan: docs/SPRINT-2-ZELF-IMPLEMENTEREN.md, opdracht S6. Test: npx vitest run backend/tests/confirmDelete.test.js
  return false
}
