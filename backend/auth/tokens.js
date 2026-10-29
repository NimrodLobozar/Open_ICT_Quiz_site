import { createHash, randomBytes } from 'node:crypto'

/** Een willekeurige token voor een cookie of een link. 32 bytes = niet te raden. */
export function newToken() {
  return randomBytes(32).toString('base64url')
}

/**
 * In de database staat alleen de hash van een token. De ruwe token heeft alleen de browser (cookie) of de link.
 * sha256 is hier genoeg (geen bcrypt nodig): de token is al lang en willekeurig, dus raden heeft geen zin.
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}
