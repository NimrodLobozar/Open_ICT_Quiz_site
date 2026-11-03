import { SKILL_CODES } from "../../src/utils/skills.js";

// Het algoritme van de willekeurige quiz: welke vragen uit de vragenbank komen erin?
// Puur: gemiddelden en vragen erin, gekozen vragen eruit. Geen Game, geen sockets, geen database.
// Daardoor kun je het testen zonder server (backend/tests/questionSelector.test.js).

export const MAX_SKILL = 5; // het bereik van de sliders is 0 t/m 5

// Niveaus van de vragen: 1 (makkelijk) t/m 5 (moeilijk). Zonder gegevens nemen we het midden.
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;
export const MIDDLE_LEVEL = 3;

/**
 * Welk niveau past bij het gemiddelde van de lobby voor één vaardigheid?
 * Afronden op een heel getal, met 1 als minimum: gemiddelde 0 of 0,4 = niveau 1, 2,5 = 3, 4,6 = 5.
 * null = niemand heeft deze vaardigheid ingevuld: dan het midden (3).
 * @param {number | null} average
 * @returns {1 | 2 | 3 | 4 | 5}
 */
export function difficultyFor(average) {
  if (average === null) return MIDDLE_LEVEL;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(average)));
}

/**
 * Hoe groot de kans is dat een vaardigheid gekozen wordt (het gewicht).
 * Keuze van het team: de ZWAKSTE vaardigheid van de lobby krijgt de meeste vragen,
 * zodat spelers leren over wat ze nog niet goed kennen.
 * Gewicht = 6 - gemiddelde: gemiddelde 0 geeft 6, gemiddelde 5 geeft 1. Nooit 0, dus ook de sterkste komt soms.
 * Wil het team juist meer vragen over sterke vaardigheden? Maak er dan `average + 1` van.
 * @param {number | null} average
 */
export function skillWeight(average) {
  return MAX_SKILL + 1 - (average ?? MAX_SKILL / 2);
}

/**
 * Kiest één item uit de lijst, met een kans naar verhouding van zijn gewicht ("weighted random selection").
 * Voorbeeld: gewichten a = 1 en b = 3 geven a in 1 van de 4 keer en b in 3 van de 4 keer.
 * @param {() => number} random geeft een getal van 0 tot 1; een test geeft hier een vaste functie mee.
 */
export function pickWeighted(items, weightOf, random = Math.random) {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  // Stel je alle gewichten voor als stukken van één lange lat. We prikken op een willekeurige plek
  // en kijken in welk stuk we zitten. Een groter gewicht = een groter stuk = meer kans.
  let ticket = random() * total;
  for (const item of items) {
    ticket -= weightOf(item);
    if (ticket < 0) return item;
  }
  return items[items.length - 1]; // alleen bij afrondingsfoutjes
}

/**
 * Kiest `count` vragen uit de vragenbank, passend bij de lobby. Geen vraag komt twee keer.
 * Per vraag: 1) kies een vaardigheid (gewogen), 2) bepaal de moeilijkheid die bij die vaardigheid past,
 * 3) neem een vraag van die vaardigheid met die moeilijkheid (of de dichtstbijzijnde als ze op zijn).
 * @param {Array<{ skill: string, difficulty: number }>} bank
 * @param {Record<string, number | null>} averages uitkomst van Game.getSkillAverages()
 * @param {number} count
 * @param {() => number} random
 */
export function selectQuestions(bank, averages, count, random = Math.random) {
  // Een kopie: we halen er vragen uit, maar de bank zelf moet heel blijven voor de volgende game.
  const remaining = bank.filter((question) =>
    SKILL_CODES.includes(question.skill),
  );
  const chosen = [];

  while (chosen.length < count && remaining.length > 0) {
    // 1. Welke vaardigheid? Alleen vaardigheden waarvan nog vragen over zijn.
    const skills = SKILL_CODES.filter((code) =>
      remaining.some((question) => question.skill === code),
    );
    const skill = pickWeighted(
      skills,
      (code) => skillWeight(averages[code] ?? null),
      random,
    );

    // 2. Welke moeilijkheid past bij de lobby voor deze vaardigheid?
    const target = difficultyFor(averages[skill] ?? null);

    // 3. De vragen van deze vaardigheid die het dichtst bij die moeilijkheid zitten.
    const ofSkill = remaining.filter((question) => question.skill === skill);
    const distance = (question) => Math.abs(question.difficulty - target);
    const closest = Math.min(...ofSkill.map(distance));
    const candidates = ofSkill.filter(
      (question) => distance(question) === closest,
    );
    const question = candidates[Math.floor(random() * candidates.length)];

    // 4. Opnemen in de quiz en uit de pot halen.
    chosen.push(question);
    remaining.splice(remaining.indexOf(question), 1);
  }
  return chosen;
}
