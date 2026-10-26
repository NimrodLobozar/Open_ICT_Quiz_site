import { ApiError } from '../utils/ApiError.js'
import { prisma } from './prisma.js'
import { buildUserWhere } from './userFilters.js'

export const USERS_PER_PAGE = 20
// Zo heet een speler in oude uitslagen nadat hij zijn account heeft verwijderd (story 6).
export const DELETED_PLAYER_NAME = 'Verwijderde speler'

/**
 * Wat de frontend van een gebruiker mag zien. Nooit de hele rij teruggeven:
 * dan stuur je per ongeluk passwordHash mee.
 */
export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    skills: user.skills ?? {},
    createdAt: user.createdAt,
  }
}

/** Eén pagina gebruikers, met per gebruiker hoeveel rondes hij gespeeld heeft. */
export async function listUsers({ role, q, page = 1 }) {
  const where = buildUserWhere({ role, q })
  // In één transactie, zodat het totaal en de pagina bij elkaar horen.
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      // role desc = beheerders bovenaan (de volgorde van de enum is STUDENT, TEACHER, ADMIN).
      orderBy: [{ role: 'desc' }, { usernameKey: 'asc' }],
      skip: (page - 1) * USERS_PER_PAGE,
      take: USERS_PER_PAGE,
      include: { _count: { select: { results: true } } },
    }),
  ])
  return {
    total,
    page,
    pageSize: USERS_PER_PAGE,
    users: users.map((user) => ({
      ...publicUser(user),
      lastActiveAt: user.lastActiveAt,
      played: user._count.results,
      activated: user.passwordHash !== null,
    })),
  }
}

/**
 * Nieuw account. Vangt de "bestaat al"-fout van de database op en maakt er een duidelijke melding van.
 * We controleren niet eerst met een losse query of het e-mailadres vrij is: tussen die check en het opslaan
 * kan iemand anders hetzelfde adres registreren. De unique-index in de database is de echte controle.
 */
export async function createUser(data) {
  try {
    return await prisma.user.create({ data })
  } catch (error) {
    throw uniqueError(error) ?? error
  }
}

export async function updateUser(id, data) {
  try {
    return await prisma.user.update({ where: { id }, data })
  } catch (error) {
    throw uniqueError(error) ?? error
  }
}

// P2002 = Prisma's code voor "deze waarde bestaat al" (unique constraint).
function uniqueError(error) {
  if (error?.code !== 'P2002') return null
  // Welke kolom het was, staat in Prisma 7 in de naam van de index (bijv. "User_email_key").
  const constraint = error.meta?.driverAdapterError?.cause?.constraint ?? {}
  const fields = [error.meta?.target, constraint.index, constraint.fields].flat().join(' ')
  if (fields.includes('email')) return new ApiError('EMAIL_TAKEN', 'Dit e-mailadres heeft al een account.', 409)
  return new ApiError('USERNAME_TAKEN', 'Deze gebruikersnaam is al bezet. Kies een andere.', 409)
}

export function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } })
}

export function findUserById(id) {
  return prisma.user.findUnique({ where: { id } })
}

/**
 * Account verwijderen (story 6 en 12). Eén transactie, zodat het nooit half gebeurt.
 * - Zijn uitslagen blijven bestaan (anders schuiven de plaatsen van de andere spelers op),
 *   maar zonder koppeling en zonder naam: daarmee zijn ze niet meer naar hem te herleiden (AVG).
 * - Sessies en eenmalige links verdwijnen vanzelf (onDelete: Cascade in het schema).
 * - Quizzen van een docent blijven bestaan zonder eigenaar (onDelete: SetNull); een beheerder ziet ze nog.
 */
export async function deleteUser(id) {
  await prisma.$transaction([
    prisma.gameResult.updateMany({ where: { userId: id }, data: { userId: null, nickname: DELETED_PLAYER_NAME } }),
    prisma.user.delete({ where: { id } }),
  ])
}
