import bcrypt from 'bcryptjs'

// bcrypt maakt van een wachtwoord een hash waar je niet meer terug kunt. Elke hash heeft een eigen "salt",
// dus twee mensen met hetzelfde wachtwoord krijgen een andere hash.
// Cost 12 = expres traag (±0,25 s), zodat iemand met een gestolen database niet snel miljoenen wachtwoorden kan proberen.
// In tests mag het sneller (BCRYPT_COST=4), anders duren de tests minuten.
const COST = Number(process.env.BCRYPT_COST) || 12

export function hashPassword(password) {
  return bcrypt.hash(password, COST)
}

export function verifyPassword(password, hash) {
  if (typeof password !== 'string' || !hash) return Promise.resolve(false)
  return bcrypt.compare(password, hash)
}

// Een geldige hash van een willekeurig wachtwoord. Bestaat het e-mailadres niet, dan vergelijken we hiermee,
// zodat inloggen even lang duurt als bij een bestaand account. Anders verraadt de snelheid welke e-mailadressen bestaan.
export const DUMMY_HASH = bcrypt.hashSync('dummy-wachtwoord-voor-gelijke-tijd', COST)
