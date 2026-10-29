import nodemailer from 'nodemailer'

// E-mail versturen (story 13). Drie situaties:
// 1. SMTP_HOST is ingesteld: echt versturen via SMTP. In Docker is dat standaard Mailpit, een nep-mailserver
//    die alles opvangt (bekijk de mails op http://localhost:8025). Voor echte mails zet je de gegevens van
//    Brevo (of een andere dienst) in .env; zie docs/MAIL.md.
// 2. Geen SMTP_HOST in development: de mail komt in de log (docker compose logs backend).
// 3. Tests (NODE_ENV=test): niets versturen, maar bewaren in `outbox`, zodat een test de link kan lezen.
// Alleen dit bestand weet hoe mail werkt; de routes roepen alleen de functies onderaan aan.

/** Het adres van de website, voor links in mails. Nooit uit de request halen: die kan een aanvaller vervalsen. */
export function appUrl() {
  return (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
}

/** Alleen in tests gevuld: de mails die "verstuurd" zijn. */
export const outbox = []

// De naam die mensen in hun inbox zien. Het adres zelf komt uit MAIL_FROM: bij Brevo moet dat een
// afzenderadres zijn dat je daar hebt bevestigd, anders weigert Brevo de mail.
const FROM_NAME = 'Open ICT Quiz'

// Eén transport, pas gemaakt bij de eerste mail (dan staan de omgevingsvariabelen zeker klaar).
let transport = null
function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 587
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 = meteen versleuteld. 587 (Brevo) begint onversleuteld en schakelt dan over (STARTTLS).
      secure: port === 465,
      // Mailpit heeft geen login; Brevo wel.
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      // Een trage of kapotte maildienst mag de website niet laten hangen: na een paar seconden opgeven.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    })
  }
  return transport
}

/**
 * Verstuurt een mail.
 * @param {{ to: string, subject: string, text: string }} mail
 * @returns {Promise<boolean>} true als de mail is verstuurd (of in development gelogd), false als er geen maildienst is.
 *   Gooit een fout als de maildienst de mail weigert of niet bereikbaar is.
 */
export async function sendMail({ to, subject, text }) {
  if (process.env.NODE_ENV === 'test') {
    outbox.push({ to, subject, text })
    return true
  }

  if (process.env.SMTP_HOST) {
    const from = { name: FROM_NAME, address: process.env.MAIL_FROM || 'noreply@quiz.local' }
    const info = await getTransport().sendMail({ from, to, subject, text })
    // Eén regel in de log, zonder de link: zo zie je dat de maildienst de mail heeft aangenomen.
    // Komt hij toch niet aan, dan zoek je hem met dit id op in de maildienst (bij Brevo: Transactional → Logs).
    console.log(`Mail "${subject}" aan ${to} afgegeven bij ${process.env.SMTP_HOST} (id ${info.messageId})`)
    return true
  }

  // In productie NOOIT de mail (met een geheime link) in de log zetten: wie de logs kan lezen,
  // zou dan elk account kunnen overnemen.
  if (process.env.NODE_ENV === 'production') {
    console.warn(`Mail "${subject}" niet verstuurd: SMTP_HOST ontbreekt (zie docs/MAIL.md).`)
    return false
  }
  console.log(
    ['', '──── E-MAIL (development: niet echt verstuurd) ────', `Aan:       ${to}`, `Onderwerp: ${subject}`, '', text, '──────────────────────────────────────────────', ''].join('\n'),
  )
  return true
}

/**
 * Zoals sendMail, maar gooit nooit: false als het niet lukte (de fout staat dan in de log).
 * Voor routes die de gebruiker willen vertellen of de mail weg is (bijv. de docent-uitnodiging).
 */
export async function trySendMail(send) {
  try {
    return await send()
  } catch (error) {
    console.error('Mail niet verstuurd:', error.message)
    return false
  }
}

export function passwordResetMail(to, link) {
  return sendMail({
    to,
    subject: 'Open ICT Quiz: nieuw wachtwoord instellen',
    text: [
      'Hoi!',
      '',
      'Je hebt een nieuw wachtwoord aangevraagd voor je account bij de Open ICT Quiz.',
      'Kies een nieuw wachtwoord via deze link (1 uur geldig, werkt één keer):',
      link,
      '',
      'Heb je dit niet aangevraagd? Dan hoef je niets te doen; je wachtwoord blijft hetzelfde.',
      '',
      'Groet, de Open ICT Quiz',
    ].join('\n'),
  })
}

export function teacherInviteMail(to, username, link) {
  return sendMail({
    to,
    subject: 'Open ICT Quiz: je docentaccount staat klaar',
    text: [
      `Hoi ${username}!`,
      '',
      'Er is een docentaccount voor je aangemaakt bij de Open ICT Quiz.',
      'Kies je wachtwoord via deze link (7 dagen geldig, werkt één keer):',
      link,
      '',
      'Groet, de Open ICT Quiz',
    ].join('\n'),
  })
}

export function verifyEmailMail(to, username, link) {
  return sendMail({
    to,
    subject: 'Open ICT Quiz: bevestig je e-mailadres',
    text: [
      `Hoi ${username}!`,
      '',
      'Je hebt een account gemaakt bij de Open ICT Quiz. Bevestig je e-mailadres via deze link (24 uur geldig):',
      link,
      '',
      'Daarna kun je inloggen.',
      'Heb je geen account gemaakt? Dan hoef je niets te doen; zonder bevestiging werkt het account niet.',
      '',
      'Groet, de Open ICT Quiz',
    ].join('\n'),
  })
}
