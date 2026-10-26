// E-mail versturen. Er is nog geen maildienst gekoppeld, dus in development zetten we de mail in de log:
//   docker compose logs backend
// Zo kun je de link uit "wachtwoord vergeten" of een docent-uitnodiging toch gebruiken.
// TODO(team): een echte dienst koppelen (bijv. nodemailer met SMTP van school). Alleen dit bestand verandert dan.

/** Het adres van de website, voor links in mails. Nooit uit de request halen: die kan een aanvaller vervalsen. */
export function appUrl() {
  return (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
}

/**
 * @param {{ to: string, subject: string, text: string }} mail
 */
export async function sendMail({ to, subject, text }) {
  // In tests geen log-spam; de tests lezen de link uit de database of het API-antwoord.
  if (process.env.NODE_ENV === 'test') return
  // In productie NOOIT de mail (met een geheime link) in de log zetten: wie de logs kan lezen,
  // zou dan elk account kunnen overnemen. Daar moet eerst een echte maildienst komen.
  if (process.env.NODE_ENV === 'production') {
    console.warn(`Mail "${subject}" niet verstuurd: er is nog geen maildienst gekoppeld (backend/mail/sendMail.js).`)
    return
  }
  console.log(
    ['', '──── E-MAIL (development: niet echt verstuurd) ────', `Aan:       ${to}`, `Onderwerp: ${subject}`, '', text, '──────────────────────────────────────────────', ''].join('\n'),
  )
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
