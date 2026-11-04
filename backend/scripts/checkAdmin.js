// Controleert de beheerder uit SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. Voor als inloggen op de server niet lukt.
// Draai hem in de backend-container (Portainer: Containers → backend → Console):
//   node backend/scripts/checkAdmin.js           alleen kijken, verandert niets
//   node backend/scripts/checkAdmin.js --reset   wachtwoord van die beheerder op SEED_ADMIN_PASSWORD zetten
// Waarom nodig? De seed (backend/db/seed.js) maakt de beheerder maar één keer. Pas je het wachtwoord in
// Portainer later aan, dan verandert het account niet. Met --reset wel.
// Het wachtwoord zelf komt nooit in de uitvoer.
import { hashPassword, verifyPassword } from '../auth/password.js'
import { prisma } from '../db/prisma.js'

const reset = process.argv.includes('--reset')
const rawEmail = process.env.SEED_ADMIN_EMAIL ?? ''
const email = rawEmail.trim().toLowerCase()
const password = process.env.SEED_ADMIN_PASSWORD ?? ''

// Aanhalingstekens of spaties in Portainer worden deel van de waarde. Dat is de meest gemaakte fout.
function warnings(value) {
  const found = []
  if (/^["']|["']$/.test(value)) found.push('begint of eindigt met een aanhalingsteken (die hoort er niet bij)')
  if (value !== value.trim()) found.push('heeft een spatie aan het begin of eind')
  return found
}

console.log(`SEED_ADMIN_EMAIL:    ${email || '(leeg)'}`)
for (const warning of warnings(rawEmail)) console.log(`  ! e-mailadres ${warning}`)
console.log(`SEED_ADMIN_PASSWORD: ${password ? `ingevuld (${password.length} tekens)` : '(leeg)'}`)
for (const warning of warnings(password)) console.log(`  ! wachtwoord ${warning}`)

const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true, createdAt: true } })
console.log(`\nBeheerders in de database: ${admins.length}`)
for (const admin of admins) console.log(`  - ${admin.email} (sinds ${admin.createdAt.toISOString().slice(0, 10)})`)

if (!email) {
  console.log('\nSEED_ADMIN_EMAIL is leeg: vul hem in bij de environment variables van de stack en herstart de backend.')
} else {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log(`\nEr is geen account met ${email}.`)
    console.log('Herstart de backend (met SEED_ADMIN_EMAIL en SEED_ADMIN_PASSWORD ingevuld): dan maakt de seed hem aan.')
  } else {
    const matches = password ? await verifyPassword(password, user.passwordHash) : false
    console.log(`\nAccount ${email}:`)
    console.log(`  rol:         ${user.role}${user.role === 'ADMIN' ? '' : '  ! geen beheerder (dit adres was al een gewoon account)'}`)
    console.log(`  bevestigd:   ${user.emailVerifiedAt ? 'ja' : 'nee'}`)
    console.log(`  wachtwoord:  ${matches ? 'klopt met SEED_ADMIN_PASSWORD' : 'klopt NIET met SEED_ADMIN_PASSWORD'}`)

    if (!matches && reset && password) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: await hashPassword(password), emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
        }),
        // Oude sessies weg: wie nog met het oude wachtwoord was ingelogd, moet opnieuw inloggen.
        prisma.session.deleteMany({ where: { userId: user.id } }),
      ])
      console.log('  → wachtwoord is nu SEED_ADMIN_PASSWORD. Log opnieuw in.')
    } else if (!matches && password) {
      console.log('  → draai dit script met --reset om het wachtwoord op SEED_ADMIN_PASSWORD te zetten.')
    }
  }
}

await prisma.$disconnect()
