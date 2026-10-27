// De bevestiging bij "Account verwijderen" (story 6): de knop werkt pas als je dit woord letterlijk typt.
// Zo verwijder je je account nooit per ongeluk met één klik. Gedeeld bestand, zodat het te testen is.
export const DELETE_CONFIRM_WORD = 'VERWIJDER'

/**
 * Heeft de gebruiker het bevestigingswoord goed getypt? Spaties aan het begin of eind tellen niet mee;
 * hoofdletters wél ("verwijder" is niet genoeg), zodat je echt even moet opletten.
 * @param {string | undefined} typed
 */
export function isDeleteConfirmed(typed) {
  return String(typed ?? '').trim() === DELETE_CONFIRM_WORD
}
